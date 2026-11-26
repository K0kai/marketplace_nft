import { expect, test } from '../support/fixtures'

test('pagamento recusado preserva o carrinho', async ({ app, page }) => {
  await app.reachReview('payment-declined')
  await app.sendButton.click()

  await expect(app.orderStatus('declined')).toBeVisible()
  await expect(app.heading('Pagamento recusado')).toBeVisible()
  await expect(app.heading('Seus NFTs agora estão na sua carteira')).toBeHidden()

  await page.getByRole('link', { name: 'Ver carrinho' }).click()
  await expect(app.total).toContainText('1.206 ETH')
})

test('cliques repetidos geram uma única requisição e um único pedido', async ({ app, page }) => {
  await app.reachReview()
  let submissions = 0
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/api/orders')) submissions++
  })
  // três cliques no mesmo instante, antes de a tela conseguir desabilitar o botão
  await app.sendButton.evaluate((button: HTMLButtonElement) => {
    button.click()
    button.click()
    button.click()
  })
  await expect(app.orderStatus('confirmed')).toBeVisible()
  expect(submissions).toBe(1)
  expect(await app.orders()).toHaveLength(1)
})

test('timeout depois da criação recupera o mesmo pedido', async ({ app }) => {
  await app.reachReview('order-timeout')
  await app.sendButton.click()

  await expect(
    app.reviewDialog.getByText('A resposta demorou demais.', { exact: false }),
  ).toBeVisible({
    timeout: 15_000,
  })
  // enquanto isso o pedido foi confirmado e o carrinho esvaziou: a recuperação continua na tela
  const [created] = await app.orders()
  expect(created!.status).toBe('confirmed')

  await app.reviewDialog.getByRole('button', { name: 'Verificar pedido' }).click()
  await expect(app.page).toHaveURL(new RegExp(`/orders/${created!.id}$`))
  expect(await app.orders()).toHaveLength(1)
})

test('timeout seguido de refresh oferece recuperar o pedido', async ({ app, page }) => {
  await app.reachReview('order-timeout')
  await app.sendButton.click()
  await expect.poll(async () => (await app.orders()).length).toBe(1)
  const [created] = await app.orders()

  // o usuário recarrega sem nunca ter recebido a resposta
  await page.reload()
  const recover = page.getByRole('button', { name: 'Recuperar pedido' })
  const track = page.getByRole('link', { name: 'Acompanhar pedido' })
  await expect(recover.or(track).first()).toBeVisible()
  await recover.or(track).first().click()

  await expect(page).toHaveURL(new RegExp(`/orders/${created!.id}$`))
  expect(await app.orders()).toHaveLength(1)
})

test('carteira que recusa a conexão mostra o motivo e permite tentar de novo', async ({
  app,
  page,
}) => {
  await app.useScenario('wallet-rejected')
  await app.login()
  await app.addToCart()
  await app.openCheckout()

  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'recusada' })).toBeVisible()

  await app.mock('scenario', { name: 'default' })
  await app.connectWallet()
  await page.getByRole('button', { name: 'Desconectar' }).click()
  await expect(page.getByText('Carteira desconectada')).toBeVisible()
})

test('API recusa a mesma chave de idempotência com outro conteúdo', async ({ app, page }) => {
  await app.reachReview('payment-pending')

  const sent = page.waitForRequest(
    (request) => request.method() === 'POST' && request.url().endsWith('/api/orders'),
  )
  await app.sendButton.click()
  const request = await sent
  await expect(app.orderStatus('pending')).toBeVisible()

  const key = (await request.headerValue('idempotency-key'))!
  const authorization = (await request.headerValue('authorization'))!
  const body = request.postDataJSON() as Record<string, unknown>

  const replay = (payload: unknown) =>
    page.evaluate(
      async ([payload, key, authorization]) => {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': key as string,
            Authorization: authorization as string,
          },
          body: JSON.stringify(payload),
        })
        return { status: response.status, body: await response.json() }
      },
      [payload, key, authorization] as const,
    )

  const same = await replay(body)
  expect(same.status).toBe(200)
  const different = await replay({ ...body, quoteId: 'quote-diferente' })
  expect(different.status).toBe(409)
  expect(different.body.error.code).toBe('IDEMPOTENCY_CONFLICT')
  expect(await app.orders()).toHaveLength(1)
})
