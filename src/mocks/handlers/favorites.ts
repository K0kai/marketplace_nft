import { http, HttpResponse } from 'msw'
import { getDb, saveDb } from '../db/store.ts'
import { findNft, toSummary } from '../domain/nft.ts'
import { apiError, notFound, requireAuth } from '../http.ts'

function favoritesOf(userId: string) {
  const ids = getDb().favorites[userId] ?? []
  const items = ids.flatMap((id) => {
    const nft = findNft(id)
    return nft ? [toSummary(nft)] : []
  })
  return { ids, items }
}

function mutate(request: Request, nftId: string, favorite: boolean) {
  const { userId } = requireAuth(request)
  const db = getDb()
  if (db.scenario === 'favorite-failure') {
    return apiError(500, 'INTERNAL', 'Não foi possível salvar o favorito.')
  }
  if (!findNft(nftId)) return notFound('NFT não encontrado.')
  const rest = (db.favorites[userId] ?? []).filter((id) => id !== nftId)
  db.favorites[userId] = favorite ? [nftId, ...rest] : rest
  saveDb()
  return HttpResponse.json(favoritesOf(userId))
}

export const favoriteHandlers = [
  http.get('*/api/favorites', ({ request }) => {
    const { userId } = requireAuth(request)
    return HttpResponse.json(favoritesOf(userId))
  }),
  http.put('*/api/favorites/:id', ({ request, params }) =>
    mutate(request, String(params.id), true),
  ),
  http.delete('*/api/favorites/:id', ({ request, params }) =>
    mutate(request, String(params.id), false),
  ),
]
