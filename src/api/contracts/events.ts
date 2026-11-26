import { z } from 'zod'
import { editionSchema } from './catalog.ts'
import { orderStatusSchema } from './commerce.ts'
import { ethSchema } from './common.ts'

const baseEvent = {
  // identidade estável do evento: permite descartar duplicatas
  eventId: z.string(),
  // versão do recurso: permite descartar eventos antigos
  version: z.number().int(),
  // eventos privados carregam o dono; null = público
  userId: z.string().nullable(),
  occurredAt: z.string(),
}

export const nftUpdatedEventSchema = z.object({
  ...baseEvent,
  type: z.literal('nft.updated'),
  resource: z.object({ type: z.literal('nft'), id: z.string() }),
  payload: z.object({
    price: ethSchema,
    previousPrice: ethSchema.nullable(),
    editions: z.array(editionSchema),
  }),
})
export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>

export const orderUpdatedEventSchema = z.object({
  ...baseEvent,
  type: z.literal('order.updated'),
  resource: z.object({ type: z.literal('order'), id: z.string() }),
  payload: z.object({
    status: orderStatusSchema,
    declineReason: z.string().nullable(),
    updatedAt: z.string(),
  }),
})
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>

export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent
