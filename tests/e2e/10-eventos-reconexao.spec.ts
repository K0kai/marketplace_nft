import { EMERALD, expect, test, USERS } from '../support/fixtures'

test('eventos duplicados ou antigos não regridem nem repetem efeitos', async ({ app, page }) => {
  await app.addToCart()
  await app.waitForSocket()
  await app.mock(`nfts/${EMERALD}`, { price: '2.5' })
  await expect(app.total).toContainText('2.516 ETH')

  const event = (await app.events()).at(-1)!
  await app.mock('emit', event)
  await app.mock('emit', {
    ...event,
    eventId: 'evt-atrasado',
    version: event.version - 1,
    payload: { ...event.payload, price: '0.01' },
  })
  await page.waitForTimeout(800)

  await expect(app.total).toContainText('2.516 ETH')
  const notice = page.getByRole('status').filter({ hasText: 'Seu carrinho mudou' })
  await expect(notice.getByRole('listitem')).toHaveCount(1)
})

test('evento antigo reentregue depois do refresh não gera aviso falso', async ({ app, page }) => {
  await app.addToCart()
  await app.waitForSocket()
  await app.mock(`nfts/${EMERALD}`, { price: '2.5' })
  await expect(app.total).toContainText('2.516 ETH')
  const first = (await app.events()).at(-1)!
  await app.mock(`nfts/${EMERALD}`, { price: '3' })
  await expect(app.total).toContainText('3.016 ETH')

  // o refresh zera o filtro do socket: só a versão dos dados pode barrar o evento velho
  await page.reload()
  await expect(app.total).toContainText('3.016 ETH')
  await app.waitForSocket()
  // o histórico do mock vive na página, então reenviamos a cópia guardada pelo teste
  await app.mock('emit', first)
  await page.waitForTimeout(800)

  await expect(app.total).toContainText('3.016 ETH')
  await expect(page.getByText('mudou de 3.00 para 2.50 ETH', { exact: false })).toHaveCount(0)
})

test('pedido pendente é recuperado depois de queda do socket e refresh', async ({ app, page }) => {
  await app.reachReview('payment-pending')
  await app.sendButton.click()
  await expect(app.orderStatus('pending')).toBeVisible()
  const [order] = await app.orders()

  await page.reload()
  await expect(app.orderStatus('pending')).toBeVisible()
  await app.waitForSocket()

  // a rede resolve o pedido enquanto o tempo real está fora do ar
  await app.mock('socket', { action: 'offline' })
  await expect(page.getByText('Reconectando atualizações ao vivo…')).toBeVisible()
  await app.mock(`orders/${order!.id}/settle`, { outcome: 'confirmed' })
  await app.mock('socket', { action: 'online' })

  await expect(app.orderStatus('confirmed')).toBeVisible()
  await expect(page.getByText('Reconectando atualizações ao vivo…')).toBeHidden()
  expect(await app.orders()).toHaveLength(1)

  // evento "pendente" atrasado não desfaz um estado final
  const confirmed = (await app.events()).findLast((e) => e.type === 'order.updated')!
  await app.mock('emit', {
    ...confirmed,
    eventId: 'evt-pendente-atrasado',
    version: 1,
    payload: { ...confirmed.payload, status: 'pending' },
  })
  await app.mock('emit', confirmed)
  await page.waitForTimeout(800)
  await expect(app.orderStatus('confirmed')).toBeVisible()
})

test('evento de outra conta é ignorado depois da troca de usuário', async ({ app, page }) => {
  await app.reachReview('payment-pending')
  await app.sendButton.click()
  await expect(app.orderStatus('pending')).toBeVisible()
  const [order] = await app.orders()

  await app.logout()
  await app.login(USERS.leo)
  await app.waitForSocket()

  // mesmo entregue ao socket do Leo, o evento privado da Nova não produz efeito
  await app.mock(`orders/${order!.id}/settle`, { outcome: 'confirmed' })
  const event = (await app.events()).findLast((e) => e.type === 'order.updated')!
  await app.mock('emit', { ...event, eventId: 'evt-vazado', userId: null })
  await page.waitForTimeout(800)
  await expect(page.getByText('Pagamento confirmado!')).toHaveCount(0)
})
