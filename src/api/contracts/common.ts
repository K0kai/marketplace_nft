import { z } from 'zod'
import { isEthString } from '../../lib/eth.ts'

export const ethSchema = z.string().refine(isEthString, 'Valor ETH inválido')

export const networkSchema = z.enum(['ethereum', 'polygon', 'solana'])
export type Network = z.infer<typeof networkSchema>

export const walletProviderSchema = z.enum(['walletconnect', 'metamask', 'coinbase'])
export type WalletProvider = z.infer<typeof walletProviderSchema>

export const errorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'SESSION_EXPIRED',
  'INVALID_CREDENTIALS',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'OUT_OF_STOCK',
  'COUPON_INVALID',
  'COUPON_EXPIRED',
  'QUOTE_STALE',
  'IDEMPOTENCY_CONFLICT',
  'PENDING_ORDER',
  'WALLET_REJECTED',
  'UNAVAILABLE',
  'INTERNAL',
])
export type ErrorCode = z.infer<typeof errorCodeSchema>

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string(),
    fieldErrors: z.record(z.string(), z.string()).optional(),
    details: z.unknown().optional(),
  }),
})
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>

export const NETWORK_LABELS: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

export const PROVIDER_LABELS: Record<WalletProvider, string> = {
  walletconnect: 'WalletConnect',
  metamask: 'MetaMask',
  coinbase: 'Coinbase Wallet',
}
