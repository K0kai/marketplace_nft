import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { Favorites, NftSummary } from '@/api/contracts'
import { favoriteApi } from '@/api/endpoints'
import { errorMessage } from '@/api/errors'
import { queryKeys } from '@/api/query-keys'
import { useSession } from '@/features/session/session-store'

export function useFavorites() {
  const userId = useSession()?.userId
  return useQuery({
    queryKey: queryKeys.favorites(userId ?? ''),
    queryFn: ({ signal }) => favoriteApi.list({ signal }),
    enabled: Boolean(userId),
  })
}

type Toggle = { nft: NftSummary; favorite: boolean; userId: string }

/** Atualização otimista: o coração muda na hora e volta atrás se a API falhar. */
function useToggleMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationKey: ['favorite'],
    // em série: cliques rápidos não se atropelam
    scope: { id: 'favorites' },
    mutationFn: ({ nft, favorite }: Toggle) => favoriteApi.set(nft.id, favorite),
    onMutate: async ({ nft, favorite, userId }) => {
      const key = queryKeys.favorites(userId)
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData<Favorites>(key)
      const base = previous ?? { ids: [], items: [] }
      client.setQueryData<Favorites>(key, {
        ids: favorite ? [nft.id, ...base.ids] : base.ids.filter((id) => id !== nft.id),
        items: favorite ? [nft, ...base.items] : base.items.filter((item) => item.id !== nft.id),
      })
      return { previous, key }
    },
    onError: (error, { nft }, context) => {
      if (context) client.setQueryData(context.key, context.previous)
      toast.error(`${errorMessage(error)} A alteração em ${nft.name} foi desfeita.`)
    },
    onSuccess: (_data, { nft, favorite }) => {
      toast.success(
        favorite ? `${nft.name} adicionado aos favoritos.` : `${nft.name} removido dos favoritos.`,
        { id: `favorite-${nft.id}` },
      )
    },
    onSettled: (_data, _error, { userId }) =>
      client.invalidateQueries({ queryKey: queryKeys.favorites(userId) }),
  })
}

export function useFavoriteToggle() {
  const session = useSession()
  const router = useRouter()
  const favorites = useFavorites()
  const mutation = useToggleMutation()

  return {
    isFavorite: (id: string) => favorites.data?.ids.includes(id) ?? false,
    toggle(nft: NftSummary) {
      if (!session) {
        toast.info('Entre para salvar favoritos.')
        void router.navigate({
          to: '/login',
          search: { redirect: router.state.location.href },
        })
        return
      }
      const favorite = !(favorites.data?.ids.includes(nft.id) ?? false)
      mutation.mutate({ nft, favorite, userId: session.userId })
    },
  }
}
