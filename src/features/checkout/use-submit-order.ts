import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import type { CreateOrderInput } from '@/api/contracts'
import { toApiError, type ApiError } from '@/api/errors'
import { queryKeys } from '@/api/query-keys'
import { useCreateOrder } from '@/features/orders/queries'
import { clearAttempt, prepareAttempt, readAttempt, type OrderAttempt } from './storage'

/** Sem resposta conclusiva o pedido pode existir: guardamos a chave para reenviar igual. */
const isInconclusive = (error: ApiError) => error.isTransient || error.code === 'SESSION_EXPIRED'

export function useSubmitOrder(userId: string, onWalletRejected: () => void) {
  const client = useQueryClient()
  const navigate = useNavigate()
  const create = useCreateOrder()
  // trava síncrona: dois cliques no mesmo instante não geram duas requisições
  const sending = useRef(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [unresolved, setUnresolved] = useState<OrderAttempt | null>(() => readAttempt(userId))

  function send(attempt: OrderAttempt) {
    if (sending.current) return
    sending.current = true
    setError(null)

    create.mutate(attempt, {
      onSuccess: (order) => {
        clearAttempt(userId)
        setUnresolved(null)
        void client.invalidateQueries({ queryKey: queryKeys.cart(userId) })
        void navigate({ to: '/orders/$orderId', params: { orderId: order.id } })
      },
      onError: (raw) => {
        const apiError = toApiError(raw)
        setError(apiError)
        if (isInconclusive(apiError)) {
          setUnresolved(attempt)
          return
        }
        clearAttempt(userId)
        setUnresolved(null)
        if (apiError.code === 'WALLET_REJECTED') onWalletRejected()
        // a cotação ou o estoque mudaram: busca os valores novos para o usuário revisar
        void client.invalidateQueries({ queryKey: queryKeys.cart(userId) })
        void client.invalidateQueries({ queryKey: queryKeys.pendingOrders(userId) })
      },
      onSettled: () => {
        sending.current = false
      },
    })
  }

  return {
    submit: (input: CreateOrderInput) => send(prepareAttempt(userId, input)),
    recover: () => unresolved && send(unresolved),
    discard() {
      clearAttempt(userId)
      setUnresolved(null)
      setError(null)
    },
    clearError: () => setError(null),
    sending: create.isPending,
    error,
    unresolved,
  }
}
