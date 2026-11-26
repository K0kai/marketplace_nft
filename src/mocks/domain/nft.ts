import type { EditionId, NftSummary } from '../../api/contracts/index.ts'
import { getDb, saveDb } from '../db/store.ts'
import type { NftRecord } from '../fixtures/nfts.ts'
import { publish } from '../realtime.ts'

export const findNft = (id: string): NftRecord | undefined =>
  getDb().nfts.find((nft) => nft.id === id)

export function toSummary(nft: NftRecord): NftSummary {
  const { id, name, tokenId, artwork, price, previousPrice, rare, category, network } = nft
  const { listedAt, editions, version } = nft
  return {
    id,
    name,
    tokenId,
    artwork,
    price,
    previousPrice,
    rare,
    category,
    network,
    listedAt,
    editions,
    version,
  }
}

export type NftChange = {
  price?: string
  editions?: Partial<Record<EditionId, number>>
}

/** Única porta de escrita no catálogo: REST e evento nft.updated saem do mesmo dado. */
export function updateNft(id: string, change: NftChange): NftRecord | undefined {
  const nft = findNft(id)
  if (!nft) return undefined

  if (change.price !== undefined && change.price !== nft.price) {
    nft.previousPrice = nft.price
    nft.price = change.price
  }
  if (change.editions) {
    nft.editions = nft.editions.map((edition) => ({
      ...edition,
      available: change.editions?.[edition.id] ?? edition.available,
    }))
  }
  nft.version += 1
  saveDb()

  publish({
    type: 'nft.updated',
    resource: { type: 'nft', id: nft.id },
    version: nft.version,
    userId: null,
    payload: { price: nft.price, previousPrice: nft.previousPrice, editions: nft.editions },
  })
  return nft
}
