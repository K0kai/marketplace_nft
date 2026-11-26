import type { CreateOrderInput, Order } from '../../api/contracts/index.ts'
import { addEth } from '../../lib/eth.ts'
import { getDb, saveDb, type OrderRecord } from '../db/store.ts'
import { apiError, contentHash, newId } from '../http.ts'
import { publish } from '../realtime.ts'
import { SETTLE_DELAY_MS, type ScenarioName } from '../scenarios.ts'
import { buildQuote, getCartRecord } from './cart.ts'
import { findNft, updateNft } from './nft.ts'

export function toPublicOrder(record: OrderRecord): Order {
  const { id, status, version, createdAt, updatedAt, declineReason } = record
  const { receipt, wallet, collector, transaction } = record
  return {
    id,
    status,
    version,
    createdAt,
    updatedAt,
    declineReason,
    receipt,
    wallet,
    collector,
    transaction,
  }
}

function fireOnce(scenario: ScenarioName, action: () => void) {
  const db = getDb()
  if (db.scenario !== scenario || db.fired.includes(scenario)) return
  db.fired.push(scenario)
  action()
  saveDb()
}

/** Cenários em que algo muda no catálogo entre a revisão e o envio do pedido. */
function applyCheckoutScenarios(owner: string) {
  const first = getCartRecord(owner).lines[0]
  if (!first) return
  fireOnce('price-changed', () => {
    const nft = findNft(first.nftId)
    if (nft) updateNft(nft.id, { price: addEth(nft.price, '0.1') })
  })
  fireOnce('sold-out', () => {
    updateNft(first.nftId, { editions: { [first.editionId]: 0 } })
  })
}

function randomHash(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
}

export function createOrder(
  userId: string,
  idempotencyKey: string,
  input: CreateOrderInput,
): { order: OrderRecord; replayed: boolean } {
  const db = getDb()
  const requestHash = contentHash(input)

  // a idempotência vem antes de tudo: um reenvio precisa achar o pedido já criado,
  // mesmo que o carrinho ou o preço tenham mudado depois dele
  const existing = db.orders.find((o) => o.userId === userId && o.idempotencyKey === idempotencyKey)
  if (existing) {
    if (existing.requestHash !== requestHash) {
      throw apiError(
        409,
        'IDEMPOTENCY_CONFLICT',
        'Esta chave de idempotência já foi usada com outro conteúdo.',
      )
    }
    return { order: existing, replayed: true }
  }

  const pending = db.orders.find((o) => o.userId === userId && o.status === 'pending')
  if (pending) {
    throw apiError(409, 'PENDING_ORDER', 'Você já tem um pedido aguardando confirmação.', {
      details: { orderId: pending.id },
    })
  }

  const wallet = db.wallets.find((w) => w.id === input.walletId)
  if (!wallet || wallet.userId !== userId) {
    throw apiError(403, 'FORBIDDEN', 'Carteira não pertence a esta conta.')
  }
  const connection = db.connections[input.connectionId]
  if (
    !connection ||
    connection.userId !== userId ||
    connection.walletId !== input.walletId ||
    connection.provider !== input.provider ||
    connection.network !== input.network
  ) {
    throw apiError(409, 'WALLET_REJECTED', 'A carteira está desconectada. Conecte novamente.')
  }

  const owner = `user:${userId}`
  applyCheckoutScenarios(owner)

  const quote = buildQuote(owner, input.network)
  if (quote.items.length === 0) {
    throw apiError(422, 'VALIDATION_ERROR', 'Seu carrinho está vazio.')
  }
  if (!quote.purchasable) {
    throw apiError(409, 'OUT_OF_STOCK', 'Um item do carrinho ficou indisponível.', {
      details: { quote },
    })
  }
  if (quote.id !== input.quoteId) {
    throw apiError(409, 'QUOTE_STALE', 'Os valores mudaram. Revise e confirme novamente.', {
      details: { quote },
    })
  }

  const now = new Date().toISOString()
  const hash = randomHash()
  const order: OrderRecord = {
    id: newId('order'),
    userId,
    idempotencyKey,
    requestHash,
    status: 'pending',
    version: 1,
    createdAt: now,
    updatedAt: now,
    declineReason: null,
    receipt: {
      lines: quote.items.map((item) => ({
        nftId: item.nftId,
        editionId: item.editionId,
        name: item.name,
        tokenId: item.tokenId,
        artwork: item.artwork,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
      subtotal: quote.subtotal,
      discount: quote.discount,
      couponCode: quote.coupon?.code ?? null,
      networkFee: quote.networkFee,
      total: quote.total,
    },
    wallet: {
      id: wallet.id,
      provider: input.provider,
      network: input.network,
      address: input.collector.walletAddress,
    },
    collector: input.collector,
    transaction: { hash, explorerUrl: `/explorer/${hash}` },
    settleAt: db.scenario === 'payment-pending' ? null : Date.now() + SETTLE_DELAY_MS,
    outcome: db.scenario === 'payment-declined' ? 'declined' : 'confirmed',
  }
  db.orders.push(order)
  saveDb()
  scheduleSettlement(order)
  return { order, replayed: false }
}

function consumePurchased(order: OrderRecord) {
  const cart = getCartRecord(`user:${order.userId}`)
  for (const line of order.receipt.lines) {
    // sai do carrinho apenas o que foi comprado: o que veio depois permanece
    const cartLine = cart.lines.find(
      (l) => l.nftId === line.nftId && l.editionId === line.editionId,
    )
    if (cartLine) cartLine.quantity -= line.quantity

    const edition = findNft(line.nftId)?.editions.find((e) => e.id === line.editionId)
    if (edition) {
      const remaining = Math.max(0, edition.available - line.quantity)
      updateNft(line.nftId, { editions: { [line.editionId]: remaining } })
    }
  }
  cart.lines = cart.lines.filter((l) => l.quantity > 0)
  if (cart.lines.length === 0) cart.couponCode = null
  cart.version += 1
}

/** pending -> confirmed | declined. Estados finais nunca mudam. */
export function settleOrder(orderId: string, outcome?: 'confirmed' | 'declined') {
  const order = getDb().orders.find((o) => o.id === orderId)
  if (!order || order.status !== 'pending') return order

  const result = outcome ?? order.outcome
  order.status = result
  order.version += 1
  order.updatedAt = new Date().toISOString()
  order.settleAt = null
  order.declineReason =
    result === 'declined' ? 'A rede recusou a transação: saldo insuficiente na carteira.' : null
  if (result === 'confirmed') consumePurchased(order)
  saveDb()

  publish({
    type: 'order.updated',
    resource: { type: 'order', id: order.id },
    version: order.version,
    userId: order.userId,
    payload: {
      status: order.status,
      declineReason: order.declineReason,
      updatedAt: order.updatedAt,
    },
  })
  return order
}

export function scheduleSettlement(order: OrderRecord) {
  if (order.settleAt === null) return
  setTimeout(() => settleIfDue(order.id), Math.max(0, order.settleAt - Date.now()))
}

/** Também chamado nas consultas: cobre o caso de a página recarregar antes do timer. */
export function settleIfDue(orderId: string) {
  const order = getDb().orders.find((o) => o.id === orderId)
  if (order?.status === 'pending' && order.settleAt !== null && Date.now() >= order.settleAt) {
    settleOrder(orderId)
  }
}

export function resumePendingOrders() {
  for (const order of getDb().orders) {
    if (order.status === 'pending') scheduleSettlement(order)
  }
}
