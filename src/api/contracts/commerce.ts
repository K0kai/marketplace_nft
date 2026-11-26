import { z } from 'zod'
import { ensSuffixSchema, walletAddressSchema, emailSchema, usernameSchema } from './account.ts'
import { artworkSchema, editionIdSchema, nftSummarySchema } from './catalog.ts'
import { ethSchema, networkSchema, walletProviderSchema } from './common.ts'

export const favoritesSchema = z.object({
  ids: z.array(z.string()),
  items: z.array(nftSummarySchema),
})
export type Favorites = z.infer<typeof favoritesSchema>

export const lineIssueSchema = z.enum(['SOLD_OUT', 'INSUFFICIENT_STOCK'])
export type LineIssue = z.infer<typeof lineIssueSchema>

export const cartItemSchema = z.object({
  id: z.string(),
  nftId: z.string(),
  editionId: editionIdSchema,
  quantity: z.number().int().min(1),
  name: z.string(),
  tokenId: z.string(),
  artwork: artworkSchema,
  unitPrice: ethSchema,
  lineTotal: ethSchema,
  // versão do NFT de onde vieram preço e estoque: permite reconhecer um evento atrasado
  nftVersion: z.number().int(),
  available: z.number().int().min(0),
  maxQuantity: z.number().int().min(0),
  issue: lineIssueSchema.nullable(),
})
export type CartItem = z.infer<typeof cartItemSchema>

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  couponCode: z.string().nullable(),
  itemCount: z.number().int(),
  version: z.number().int(),
})
export type Cart = z.infer<typeof cartSchema>

export const addCartItemSchema = z.object({
  nftId: z.string(),
  editionId: editionIdSchema,
  quantity: z.number().int().min(1),
})
export type AddCartItemInput = z.infer<typeof addCartItemSchema>

export const updateCartItemSchema = z.object({ quantity: z.number().int().min(1) })

export const couponInputSchema = z.object({
  code: z.string().trim().min(1, 'Digite um código').max(32),
})

export const couponSchema = z.object({
  code: z.string(),
  label: z.string(),
  basisPoints: z.number().int(),
})

export const quoteSchema = z.object({
  // o id é um hash do conteúdo: se qualquer valor mudar, o id muda junto
  id: z.string(),
  network: networkSchema,
  items: z.array(cartItemSchema),
  coupon: couponSchema.nullable(),
  couponError: z.string().nullable(),
  subtotal: ethSchema,
  discount: ethSchema,
  networkFee: ethSchema,
  total: ethSchema,
  purchasable: z.boolean(),
})
export type Quote = z.infer<typeof quoteSchema>

export const quoteInputSchema = z.object({ network: networkSchema })

const requiredText = (label: string, max = 60) =>
  z.string().trim().min(1, `Informe ${label}`).max(max)

export const collectorSchema = z.object({
  displayName: requiredText('o nome de exibição'),
  username: usernameSchema,
  network: z.enum(networkSchema.options, { error: 'Selecione uma rede' }),
  profileName: requiredText('o nome do perfil'),
  walletAddress: walletAddressSchema,
  secondaryWallet: z.string().trim().max(80).optional(),
  walletType: z.enum(walletProviderSchema.options, { error: 'Selecione o tipo de carteira' }),
  referralCode: requiredText('o código de indicação', 24),
  email: emailSchema,
  ensSuffix: ensSuffixSchema,
  ensName: requiredText('o nome ENS', 40),
  note: z.string().trim().max(280, 'Use no máximo 280 caracteres').optional(),
})
export type Collector = z.infer<typeof collectorSchema>

export const createOrderSchema = z.object({
  quoteId: z.string(),
  walletId: z.string(),
  connectionId: z.string(),
  provider: walletProviderSchema,
  network: networkSchema,
  collector: collectorSchema,
})
export type CreateOrderInput = z.infer<typeof createOrderSchema>

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'declined'])
export type OrderStatus = z.infer<typeof orderStatusSchema>

export const orderLineSchema = z.object({
  nftId: z.string(),
  editionId: editionIdSchema,
  name: z.string(),
  tokenId: z.string(),
  artwork: artworkSchema,
  quantity: z.number().int(),
  unitPrice: ethSchema,
  lineTotal: ethSchema,
})

export const orderSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  version: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
  declineReason: z.string().nullable(),
  // snapshot gravado na criação: mudanças no catálogo não alteram o recibo
  receipt: z.object({
    lines: z.array(orderLineSchema),
    subtotal: ethSchema,
    discount: ethSchema,
    couponCode: z.string().nullable(),
    networkFee: ethSchema,
    total: ethSchema,
  }),
  wallet: z.object({
    id: z.string(),
    provider: walletProviderSchema,
    network: networkSchema,
    address: z.string(),
  }),
  collector: collectorSchema,
  transaction: z.object({ hash: z.string(), explorerUrl: z.string() }),
})
export type Order = z.infer<typeof orderSchema>

export const orderListSchema = z.object({ items: z.array(orderSchema) })
