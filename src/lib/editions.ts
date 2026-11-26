import type { Edition, NftSummary } from '@/api/contracts'

export const isSoldOut = (nft: Pick<NftSummary, 'editions'>) =>
  nft.editions.every((edition) => edition.available === 0)

/** Prefere a 1/50 (a do layout); senão a primeira disponível. */
export function defaultEdition(editions: Edition[]): Edition {
  const available = editions.filter((edition) => edition.available > 0)
  return available.find((edition) => edition.id === '1-50') ?? available[0] ?? editions[0]!
}
