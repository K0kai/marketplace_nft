import { http, HttpResponse } from 'msw'
import { getDb } from '../db/store.ts'
import { parseCatalogParams, queryCatalog } from '../domain/catalog.ts'
import { findNft, toSummary } from '../domain/nft.ts'
import { notFound } from '../http.ts'

const HERO_IDS = ['emerald-ape-042', 'violet-nomad-314', 'ivory-baron-088']
const FEATURED_ID = 'sage-nomad-009'

export const catalogHandlers = [
  http.get('*/api/nfts', ({ request }) => {
    const db = getDb()
    const params = parseCatalogParams(new URL(request.url).searchParams)
    const source = db.scenario === 'empty-catalog' ? [] : db.nfts
    return HttpResponse.json(queryCatalog(source, params))
  }),

  // precisa vir antes de /:id, senão "highlights" vira um identificador
  http.get('*/api/nfts/highlights', () => {
    const pick = (id: string) => toSummary(findNft(id) ?? getDb().nfts[0]!)
    return HttpResponse.json({ hero: HERO_IDS.map(pick), featured: pick(FEATURED_ID) })
  }),

  http.get('*/api/nfts/:id', ({ params }) => {
    const nft = findNft(String(params.id))
    if (!nft) return notFound('NFT não encontrado.')
    const { trendingScore: _, ...detail } = nft
    return HttpResponse.json(detail)
  }),

  http.get('*/api/nfts/:id/related', ({ params }) => {
    const nft = findNft(String(params.id))
    if (!nft) return notFound('NFT não encontrado.')
    const items = getDb()
      .nfts.filter((other) => other.id !== nft.id)
      .slice(2, 17) // três páginas de cinco, como no layout
      .map(toSummary)
    return HttpResponse.json({ items })
  }),
]
