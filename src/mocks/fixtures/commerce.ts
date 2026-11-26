import type { Network } from '../../api/contracts/index.ts'

export type CouponFixture = {
  code: string
  label: string
  basisPoints: number
  expiresAt: string | null
}

export const COUPONS: CouponFixture[] = [
  { code: 'KURIO10', label: '10% no lançamento', basisPoints: 1000, expiresAt: null },
  { code: 'COLECIONADOR5', label: '5% para colecionadores', basisPoints: 500, expiresAt: null },
  {
    code: 'GENESIS2025',
    label: 'Gênesis 2025',
    basisPoints: 2000,
    expiresAt: '2025-12-31T23:59:59Z',
  },
]

export const NETWORK_FEES: Record<Network, string> = {
  ethereum: '0.016',
  polygon: '0.002',
  solana: '0.001',
}
