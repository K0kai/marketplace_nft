import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orderApi } from '@/api/endpoints'
import { queryKeys } from '@/api/query-keys'
import type { OrderAttempt } from '@/features/checkout/storage'
import { useSession } from '@/features/session/session-store'

const PENDING_POLL_MS = 5000

export function useOrder(id: string) {
  const userId = useSession()?.userId ?? ''
  return useQuery({
    queryKey: queryKeys.order(userId, id),
    queryFn: ({ signal }) => orderApi.get(id, { signal }),
    enabled: Boolean(userId),
    // o evento do socket é o caminho principal; a consulta periódica é a rede de segurança
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? PENDING_POLL_MS : false),
  })
}

export function usePendingOrders() {
  const userId = useSession()?.userId ?? ''
  return useQuery({
    queryKey: queryKeys.pendingOrders(userId),
    queryFn: ({ signal }) => orderApi.listPending({ signal }),
    enabled: Boolean(userId),
    staleTime: 0,
  })
}

export function useCreateOrder() {
  const client = useQueryClient()
  const userId = useSession()?.userId ?? ''
  return useMutation({
    mutationFn: ({ key, input }: OrderAttempt) => orderApi.create(input, key),
    onSuccess: (order) => {
      client.setQueryData(queryKeys.order(userId, order.id), order)
      void client.invalidateQueries({ queryKey: queryKeys.pendingOrders(userId) })
    },
  })
}
