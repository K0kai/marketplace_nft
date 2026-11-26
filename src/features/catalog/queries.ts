import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { CatalogParams } from '@/api/contracts'
import { nftApi } from '@/api/endpoints'
import { queryKeys } from '@/api/query-keys'

// O `signal` do Query chega ao Axios: trocar de filtro cancela a requisição anterior.
export function useCatalog(params: CatalogParams) {
  return useQuery({
    queryKey: queryKeys.nftList(params),
    queryFn: ({ signal }) => nftApi.list(params, { signal }),
    placeholderData: keepPreviousData,
  })
}

export function useHighlights() {
  return useQuery({
    queryKey: queryKeys.highlights,
    queryFn: ({ signal }) => nftApi.highlights({ signal }),
    staleTime: 5 * 60_000,
  })
}

export function useNft(id: string) {
  return useQuery({
    queryKey: queryKeys.nftDetail(id),
    queryFn: ({ signal }) => nftApi.detail(id, { signal }),
  })
}

export function useRelatedNfts(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.nftRelated(id ?? ''),
    queryFn: ({ signal }) => nftApi.related(id!, { signal }),
    enabled: Boolean(id),
  })
}
