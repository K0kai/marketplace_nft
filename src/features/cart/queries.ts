import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { AddCartItemInput, Cart, Network } from '@/api/contracts'
import { cartApi } from '@/api/endpoints'
import { errorMessage } from '@/api/errors'
import { queryKeys } from '@/api/query-keys'
import { useSession } from '@/features/session/session-store'

export function useCart() {
  const userId = useSession()?.userId ?? null
  return useQuery({
    queryKey: queryKeys.cart(userId),
    queryFn: ({ signal }) => cartApi.get({ signal }),
  })
}

/** A cotação da API é a única fonte dos valores exibidos e enviados no pedido. */
export function useQuote(network: Network) {
  const userId = useSession()?.userId ?? null
  const cart = useCart()
  return useQuery({
    queryKey: queryKeys.quote(userId, network),
    queryFn: ({ signal }) => cartApi.quote(network, { signal }),
    enabled: (cart.data?.items.length ?? 0) > 0,
    staleTime: 0,
  })
}

/** Toda mutation devolve o carrinho novo: gravamos no cache e pedimos uma cotação nova. */
function useCartMutation<T>(
  mutationFn: (input: T) => Promise<Cart>,
  options: { silent?: boolean } = {},
) {
  const client = useQueryClient()
  const userId = useSession()?.userId ?? null
  return useMutation({
    scope: { id: 'cart' },
    mutationFn,
    onMutate: () => ({ key: queryKeys.cart(userId) }),
    onSuccess: async (cart, _input, context) => {
      await client.cancelQueries({ queryKey: context.key })
      client.setQueryData(context.key, cart)
      void client.invalidateQueries({ queryKey: [...context.key, 'quote'] })
    },
    onError: (error, _input, context) => {
      if (!options.silent) toast.error(errorMessage(error))
      // conflito de estoque: busca o estado real em vez de confiar no cache
      if (context) void client.invalidateQueries({ queryKey: context.key })
    },
  })
}

export const useAddToCart = () => useCartMutation((input: AddCartItemInput) => cartApi.add(input))

export const useUpdateCartItem = () =>
  useCartMutation(({ id, quantity }: { id: string; quantity: number }) =>
    cartApi.update(id, quantity),
  )

export const useRemoveCartItem = () => useCartMutation((id: string) => cartApi.remove(id))

// o erro do cupom aparece junto do campo, não em toast
export const useApplyCoupon = () =>
  useCartMutation((code: string) => cartApi.applyCoupon(code), { silent: true })

export const useRemoveCoupon = () => useCartMutation((_: void) => cartApi.removeCoupon())
