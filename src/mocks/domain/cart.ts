import type { Cart, CartItem, EditionId, Network, Quote } from '../../api/contracts/index.ts'
import { addEth, multiplyEth, percentOfEth, subtractEth } from '../../lib/eth.ts'
import { getDb, saveDb, type CartRecord } from '../db/store.ts'
import { COUPONS, NETWORK_FEES } from '../fixtures/commerce.ts'
import { apiError, contentHash } from '../http.ts'
import { findNft } from './nft.ts'

export const lineId = (nftId: string, editionId: EditionId) => `${nftId}__${editionId}`

export function getCartRecord(owner: string): CartRecord {
  const db = getDb()
  return (db.carts[owner] ??= { lines: [], couponCode: null, version: 0 })
}

function touch(cart: CartRecord) {
  cart.version += 1
  saveDb()
}

/** Preço e disponibilidade sempre vêm do catálogo atual, nunca do que o cliente mandou. */
export function buildCartItems(record: CartRecord): CartItem[] {
  return record.lines.flatMap((line) => {
    const nft = findNft(line.nftId)
    const edition = nft?.editions.find((e) => e.id === line.editionId)
    if (!nft || !edition) return []
    const maxQuantity = Math.min(edition.available, edition.maxPerOrder)
    const issue =
      edition.available === 0
        ? ('SOLD_OUT' as const)
        : line.quantity > maxQuantity
          ? ('INSUFFICIENT_STOCK' as const)
          : null
    return [
      {
        id: lineId(line.nftId, line.editionId),
        nftId: nft.id,
        editionId: line.editionId,
        quantity: line.quantity,
        name: nft.name,
        tokenId: nft.tokenId,
        artwork: nft.artwork,
        unitPrice: nft.price,
        lineTotal: multiplyEth(nft.price, line.quantity),
        nftVersion: nft.version,
        available: edition.available,
        maxQuantity,
        issue,
      },
    ]
  })
}

export function buildCart(owner: string): Cart {
  const record = getCartRecord(owner)
  const items = buildCartItems(record)
  return {
    items,
    couponCode: record.couponCode,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    version: record.version,
  }
}

function requireEdition(nftId: string, editionId: EditionId) {
  const edition = findNft(nftId)?.editions.find((e) => e.id === editionId)
  if (!edition) throw apiError(404, 'NOT_FOUND', 'NFT ou edição não encontrada')
  return edition
}

function assertQuantity(nftId: string, editionId: EditionId, quantity: number) {
  const edition = requireEdition(nftId, editionId)
  if (edition.available === 0) {
    throw apiError(409, 'OUT_OF_STOCK', 'Esta edição está esgotada.', {
      details: { available: 0 },
    })
  }
  const max = Math.min(edition.available, edition.maxPerOrder)
  if (quantity > max) {
    throw apiError(409, 'OUT_OF_STOCK', `Limite de ${max} unidade(s) para esta edição.`, {
      details: { available: max },
    })
  }
}

export function addLine(owner: string, nftId: string, editionId: EditionId, quantity: number) {
  const cart = getCartRecord(owner)
  const existing = cart.lines.find((l) => l.nftId === nftId && l.editionId === editionId)
  const total = (existing?.quantity ?? 0) + quantity
  assertQuantity(nftId, editionId, total)
  if (existing) existing.quantity = total
  else cart.lines.push({ nftId, editionId, quantity })
  touch(cart)
}

export function updateLine(owner: string, itemId: string, quantity: number) {
  const cart = getCartRecord(owner)
  const line = cart.lines.find((l) => lineId(l.nftId, l.editionId) === itemId)
  if (!line) throw apiError(404, 'NOT_FOUND', 'Item não está no carrinho')
  // reduzir é sempre permitido: é como o usuário resolve um conflito de estoque
  if (quantity > line.quantity) assertQuantity(line.nftId, line.editionId, quantity)
  line.quantity = quantity
  touch(cart)
}

export function removeLine(owner: string, itemId: string) {
  const cart = getCartRecord(owner)
  cart.lines = cart.lines.filter((l) => lineId(l.nftId, l.editionId) !== itemId)
  if (cart.lines.length === 0) cart.couponCode = null
  touch(cart)
}

export function findCoupon(code: string) {
  return COUPONS.find((coupon) => coupon.code === code.trim().toUpperCase())
}

const isExpired = (expiresAt: string | null) =>
  expiresAt !== null && Date.parse(expiresAt) < Date.now()

export function applyCoupon(owner: string, code: string) {
  const coupon = findCoupon(code)
  if (!coupon) {
    throw apiError(422, 'COUPON_INVALID', 'Código promocional inválido.', {
      fieldErrors: { code: 'Código promocional inválido.' },
    })
  }
  if (isExpired(coupon.expiresAt)) {
    throw apiError(422, 'COUPON_EXPIRED', 'Este código promocional expirou.', {
      fieldErrors: { code: 'Este código promocional expirou.' },
    })
  }
  const cart = getCartRecord(owner)
  cart.couponCode = coupon.code
  touch(cart)
}

export function removeCoupon(owner: string) {
  const cart = getCartRecord(owner)
  cart.couponCode = null
  touch(cart)
}

export function buildQuote(owner: string, network: Network): Quote {
  const record = getCartRecord(owner)
  const items = buildCartItems(record)
  const subtotal = addEth('0', ...items.map((item) => item.lineTotal))

  const found = record.couponCode ? findCoupon(record.couponCode) : undefined
  const expired = found ? isExpired(found.expiresAt) : false
  const coupon = found && !expired ? found : null

  const discount = coupon ? percentOfEth(subtotal, coupon.basisPoints) : '0'
  const networkFee = items.length > 0 ? NETWORK_FEES[network] : '0'
  const total = addEth(subtractEth(subtotal, discount), networkFee)

  const content = {
    network,
    lines: items.map((i) => [i.id, i.quantity, i.unitPrice, i.issue]),
    coupon: coupon?.code ?? null,
    discount,
    networkFee,
    total,
  }

  return {
    id: `quote-${contentHash(content)}`,
    network,
    items,
    coupon: coupon && {
      code: coupon.code,
      label: coupon.label,
      basisPoints: coupon.basisPoints,
    },
    couponError: expired ? 'O cupom aplicado expirou e foi desconsiderado.' : null,
    subtotal,
    discount,
    networkFee,
    total,
    purchasable: items.length > 0 && items.every((item) => item.issue === null),
  }
}

/** Ao autenticar, o carrinho do visitante é somado ao do usuário, respeitando o estoque. */
export function mergeGuestCart(guestId: string | null, userId: string) {
  if (!guestId) return
  const db = getDb()
  const guestKey = `guest:${guestId}`
  const guest = db.carts[guestKey]
  if (!guest) return

  const target = getCartRecord(`user:${userId}`)
  for (const line of guest.lines) {
    const edition = findNft(line.nftId)?.editions.find((e) => e.id === line.editionId)
    const existing = target.lines.find(
      (l) => l.nftId === line.nftId && l.editionId === line.editionId,
    )
    const wanted = (existing?.quantity ?? 0) + line.quantity
    const max = Math.min(edition?.available ?? 0, edition?.maxPerOrder ?? 0)
    // item esgotado continua no carrinho (marcado com aviso) em vez de sumir
    const quantity = max > 0 ? Math.min(wanted, max) : wanted
    if (existing) existing.quantity = quantity
    else target.lines.push({ ...line, quantity })
  }
  target.couponCode ??= guest.couponCode
  delete db.carts[guestKey]
  touch(target)
}
