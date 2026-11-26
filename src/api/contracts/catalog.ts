import { z } from 'zod'
import { ethSchema, networkSchema } from './common.ts'

export const categorySchema = z.enum([
  'digital-art',
  'photography',
  'music',
  '3d-art',
  'collectibles',
  'generative',
  'games',
  'subscriptions',
  'utility',
])
export type Category = z.infer<typeof categorySchema>

export const CATEGORY_LABELS: Record<Category, string> = {
  'digital-art': 'Arte digital',
  photography: 'Fotografia',
  music: 'Música',
  '3d-art': 'Arte 3D',
  collectibles: 'Colecionáveis',
  generative: 'Generativa',
  games: 'Jogos',
  subscriptions: 'Assinaturas',
  utility: 'Utilidade',
}

export const editionIdSchema = z.enum(['1-1', '1-10', '1-50', 'open'])
export type EditionId = z.infer<typeof editionIdSchema>

export const EDITION_LABELS: Record<EditionId, string> = {
  '1-1': '1/1',
  '1-10': '1/10',
  '1-50': '1/50',
  open: 'ABERTA',
}

export const editionSchema = z.object({
  id: editionIdSchema,
  available: z.number().int().min(0),
  maxPerOrder: z.number().int().min(1),
})
export type Edition = z.infer<typeof editionSchema>

export const artworkSchema = z.enum(['emerald', 'sage', 'ivory', 'golden'])
export type Artwork = z.infer<typeof artworkSchema>

export const nftSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  tokenId: z.string(),
  artwork: artworkSchema,
  price: ethSchema,
  previousPrice: ethSchema.nullable(),
  rare: z.boolean(),
  category: categorySchema,
  network: networkSchema,
  listedAt: z.string(),
  editions: z.array(editionSchema),
  version: z.number().int(),
})
export type NftSummary = z.infer<typeof nftSummarySchema>

export const reviewSchema = z.object({
  id: z.string(),
  author: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string(),
})

export const nftDetailSchema = nftSummarySchema.extend({
  summary: z.string(),
  description: z.array(z.string()),
  collection: z.string(),
  creator: z.string(),
  attributes: z.array(z.string()),
  gallery: z.array(artworkSchema),
  rating: z.number(),
  reviewsCount: z.number().int(),
  reviews: z.array(reviewSchema),
  contractAddress: z.string(),
  royaltyPercent: z.number(),
})
export type NftDetail = z.infer<typeof nftDetailSchema>

export const catalogTabSchema = z.enum(['all', 'new', 'trending'])
export const catalogSortSchema = z.enum(['recent', 'price-asc', 'price-desc', 'name'])
export type CatalogTab = z.infer<typeof catalogTabSchema>
export type CatalogSort = z.infer<typeof catalogSortSchema>

export const SORT_LABELS: Record<CatalogSort, string> = {
  recent: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  name: 'Nome (A–Z)',
}

export const PAGE_SIZE = 9

export type CatalogParams = {
  q?: string
  category?: Category
  network?: z.infer<typeof networkSchema>
  minPrice?: string
  maxPrice?: string
  tab?: CatalogTab
  sort?: CatalogSort
  page?: number
}

export const catalogResponseSchema = z.object({
  items: z.array(nftSummarySchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
  facets: z.object({
    categories: z.array(z.object({ id: categorySchema, count: z.number().int() })),
    networks: z.array(z.object({ id: networkSchema, count: z.number().int() })),
    priceRange: z.object({ min: ethSchema, max: ethSchema }),
  }),
})
export type CatalogResponse = z.infer<typeof catalogResponseSchema>

export const highlightsResponseSchema = z.object({
  hero: z.array(nftSummarySchema),
  featured: nftSummarySchema,
})
export type HighlightsResponse = z.infer<typeof highlightsResponseSchema>

export const nftListSchema = z.object({ items: z.array(nftSummarySchema) })
