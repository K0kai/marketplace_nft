import { z } from 'zod'
import { catalogSortSchema, catalogTabSchema, categorySchema, networkSchema } from '@/api/contracts'
import { isEthString } from '@/lib/eth'

const price = z.string().refine(isEthString).optional().catch(undefined)

// Parâmetro inválido na URL é ignorado em vez de quebrar a página.
export const catalogSearchSchema = z.object({
  q: z.string().max(60).optional().catch(undefined),
  category: categorySchema.optional().catch(undefined),
  network: networkSchema.optional().catch(undefined),
  minPrice: price,
  maxPrice: price,
  tab: catalogTabSchema.exclude(['all']).optional().catch(undefined),
  sort: catalogSortSchema.exclude(['recent']).optional().catch(undefined),
  page: z.coerce.number().int().min(2).optional().catch(undefined),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>
