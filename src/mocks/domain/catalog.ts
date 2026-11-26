import {
  PAGE_SIZE,
  categorySchema,
  networkSchema,
  type CatalogParams,
  type CatalogResponse,
} from '../../api/contracts/index.ts'
import { compareEth, isEthString } from '../../lib/eth.ts'
import { FIXTURE_NOW, type NftRecord } from '../fixtures/nfts.ts'
import { toSummary } from './nft.ts'

const NEW_WINDOW_MS = 14 * 24 * 3_600_000
const TRENDING_THRESHOLD = 70

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

export function parseCatalogParams(query: URLSearchParams): CatalogParams {
  const price = (key: string) => {
    const value = query.get(key)
    return value && isEthString(value) ? value : undefined
  }
  const tab = query.get('tab')
  const sort = query.get('sort')
  return {
    q: query.get('q') ?? undefined,
    category: categorySchema.safeParse(query.get('category')).data,
    network: networkSchema.safeParse(query.get('network')).data,
    minPrice: price('minPrice'),
    maxPrice: price('maxPrice'),
    tab: tab === 'new' || tab === 'trending' ? tab : 'all',
    sort: sort === 'price-asc' || sort === 'price-desc' || sort === 'name' ? sort : 'recent',
    page: Math.max(1, Number.parseInt(query.get('page') ?? '1', 10) || 1),
  }
}

type FilterKey = 'category' | 'network' | 'price'

function matches(nft: NftRecord, params: CatalogParams, ignore?: FilterKey): boolean {
  if (params.q) {
    const haystack = normalize(`${nft.name} ${nft.tokenId} ${nft.collection} ${nft.creator}`)
    if (!haystack.includes(normalize(params.q.trim()))) return false
  }
  if (params.tab === 'new' && FIXTURE_NOW - Date.parse(nft.listedAt) > NEW_WINDOW_MS) return false
  if (params.tab === 'trending' && nft.trendingScore < TRENDING_THRESHOLD) return false
  if (ignore !== 'category' && params.category && nft.category !== params.category) return false
  if (ignore !== 'network' && params.network && nft.network !== params.network) return false
  if (ignore !== 'price') {
    if (params.minPrice && compareEth(nft.price, params.minPrice) < 0) return false
    if (params.maxPrice && compareEth(nft.price, params.maxPrice) > 0) return false
  }
  return true
}

const SORTERS: Record<
  NonNullable<CatalogParams['sort']>,
  (a: NftRecord, b: NftRecord) => number
> = {
  recent: (a, b) => Date.parse(b.listedAt) - Date.parse(a.listedAt),
  'price-asc': (a, b) => compareEth(a.price, b.price),
  'price-desc': (a, b) => compareEth(b.price, a.price),
  name: (a, b) => a.name.localeCompare(b.name, 'pt-BR'),
}

export function queryCatalog(nfts: NftRecord[], params: CatalogParams): CatalogResponse {
  const filtered = nfts.filter((nft) => matches(nft, params)).sort(SORTERS[params.sort ?? 'recent'])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(params.page ?? 1, totalPages)
  const prices = nfts.map((nft) => nft.price).sort(compareEth)

  // cada faceta ignora o próprio filtro, para o usuário ver quantos itens há nas outras opções
  const count = <T extends string>(ids: readonly T[], key: 'category' | 'network') => {
    const base = nfts.filter((nft) => matches(nft, params, key))
    return ids.map((id) => ({ id, count: base.filter((nft) => nft[key] === id).length }))
  }

  return {
    items: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(toSummary),
    page,
    pageSize: PAGE_SIZE,
    total: filtered.length,
    totalPages,
    facets: {
      categories: count(categorySchema.options, 'category'),
      networks: count(networkSchema.options, 'network'),
      priceRange: { min: prices[0] ?? '0', max: prices.at(-1) ?? '0' },
    },
  }
}
