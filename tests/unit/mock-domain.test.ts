import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import type { CreateOrderInput } from '../../src/api/contracts/index.ts'
import { getDb, resetDb } from '../../src/mocks/db/store.ts'
import {
  addLine,
  applyCoupon,
  buildCart,
  buildQuote,
  mergeGuestCart,
} from '../../src/mocks/domain/cart.ts'
import { queryCatalog } from '../../src/mocks/domain/catalog.ts'
import { updateNft } from '../../src/mocks/domain/nft.ts'
import { createOrder, settleOrder } from '../../src/mocks/domain/orders.ts'

const OWNER = 'user:user-nova'

beforeEach(() => {
  resetDb('payment-pending')
  getDb().connections['conn-1'] = {
    id: 'conn-1',
    userId: 'user-nova',
    walletId: 'wallet-nova-primary',
    provider: 'metamask',
    network: 'ethereum',
    status: 'connected',
  }
})

function orderInput(quoteId: string): CreateOrderInput {
  return {
    quoteId,
    walletId: 'wallet-nova-primary',
    connectionId: 'conn-1',
    provider: 'metamask',
    network: 'ethereum',
    collector: {
      displayName: 'Nova Sato',
      username: 'novasato',
      network: 'ethereum',
      profileName: 'Nova Collector',
      walletAddress: '0xA91F3c5B7e2D4a8F9b1C6d0E5f7A2B8c4D6eE82C',
      walletType: 'metamask',
      referralCode: 'KURIO-NOVA',
      email: 'nova@kurio.test',
      ensSuffix: '.eth',
      ensName: 'nova',
    },
  }
}

const errorCode = async (thrown: unknown) =>
  thrown instanceof Response
    ? ((await thrown.json()) as { error: { code: string } }).error.code
    : ''

async function expectError(action: () => unknown, code: string) {
  try {
    action()
  } catch (thrown) {
    assert.equal(await errorCode(thrown), code)
    return
  }
  assert.fail(`esperava o erro ${code}`)
}

test('catálogo combina filtros e pagina', () => {
  const nfts = getDb().nfts
  const all = queryCatalog(nfts, {})
  assert.equal(all.total, 60)
  assert.equal(all.items[0]?.name, 'Emerald Ape #042')

  const filtered = queryCatalog(nfts, { category: 'music', maxPrice: '1', sort: 'price-asc' })
  assert.ok(filtered.items.every((n) => n.category === 'music' && Number(n.price) <= 1))
  assert.equal(queryCatalog(nfts, { q: 'não existe' }).total, 0)
})

test('cotação reproduz os valores do layout e aplica cupom', () => {
  addLine(OWNER, 'emerald-ape-042', '1-50', 2)
  addLine(OWNER, 'violet-nomad-314', '1-50', 6)
  addLine(OWNER, 'ivory-baron-088', '1-50', 9)
  const quote = buildQuote(OWNER, 'ethereum')
  assert.equal(quote.subtotal, '26.83')
  assert.equal(quote.total, '26.846')

  applyCoupon(OWNER, 'kurio10')
  assert.equal(buildQuote(OWNER, 'ethereum').discount, '2.683')
})

test('respeita estoque e cupons inválidos ou expirados', async () => {
  await expectError(() => addLine(OWNER, 'emerald-ape-042', '1-1', 1), 'OUT_OF_STOCK')
  await expectError(() => addLine(OWNER, 'emerald-ape-042', '1-50', 11), 'OUT_OF_STOCK')
  await expectError(() => applyCoupon(OWNER, 'NADA'), 'COUPON_INVALID')
  await expectError(() => applyCoupon(OWNER, 'GENESIS2025'), 'COUPON_EXPIRED')
})

test('mesma chave devolve o mesmo pedido; conteúdo diferente gera conflito', async () => {
  addLine(OWNER, 'emerald-ape-042', '1-50', 1)
  const input = orderInput(buildQuote(OWNER, 'ethereum').id)
  const first = createOrder('user-nova', 'key-1', input)
  const second = createOrder('user-nova', 'key-1', input)
  assert.equal(second.order.id, first.order.id)
  assert.equal(second.replayed, true)

  await expectError(
    () => createOrder('user-nova', 'key-1', { ...input, quoteId: 'outro' }),
    'IDEMPOTENCY_CONFLICT',
  )
  await expectError(() => createOrder('user-nova', 'key-2', input), 'PENDING_ORDER')
})

test('preço alterado invalida a cotação revisada', async () => {
  addLine(OWNER, 'emerald-ape-042', '1-50', 1)
  const input = orderInput(buildQuote(OWNER, 'ethereum').id)
  updateNft('emerald-ape-042', { price: '1.5' })
  await expectError(() => createOrder('user-nova', 'key-1', input), 'QUOTE_STALE')
})

test('confirmação remove só o comprado; recibo é snapshot e o estado é terminal', () => {
  addLine(OWNER, 'emerald-ape-042', '1-50', 2)
  const input = orderInput(buildQuote(OWNER, 'ethereum').id)
  const { order } = createOrder('user-nova', 'key-1', input)
  addLine(OWNER, 'emerald-ape-042', '1-50', 1)
  addLine(OWNER, 'sage-nomad-009', '1-50', 1)

  settleOrder(order.id, 'confirmed')
  settleOrder(order.id, 'declined')
  updateNft('emerald-ape-042', { price: '9' })

  assert.equal(order.status, 'confirmed')
  assert.equal(order.receipt.lines[0]?.unitPrice, '1.19')
  assert.deepEqual(
    buildCart(OWNER).items.map((i) => [i.nftId, i.quantity]),
    [
      ['emerald-ape-042', 1],
      ['sage-nomad-009', 1],
    ],
  )
})

test('pagamento recusado preserva o carrinho', () => {
  addLine(OWNER, 'sage-nomad-009', '1-50', 1)
  const { order } = createOrder('user-nova', 'k', orderInput(buildQuote(OWNER, 'ethereum').id))
  settleOrder(order.id, 'declined')
  assert.equal(buildCart(OWNER).itemCount, 1)
})

test('login soma o carrinho do visitante respeitando o limite', () => {
  addLine('guest:abc', 'emerald-ape-042', '1-50', 8)
  addLine(OWNER, 'emerald-ape-042', '1-50', 5)
  mergeGuestCart('abc', 'user-nova')
  assert.equal(buildCart(OWNER).items[0]?.quantity, 10)
  assert.equal(getDb().carts['guest:abc'], undefined)
})
