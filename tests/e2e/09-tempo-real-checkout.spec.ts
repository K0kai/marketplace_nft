import { EMERALD, expect, test } from '../support/fixtures'

test('preço que muda durante a revisão exige nova confirmação', async ({ app, page }) => {
  await app.reachReview()
  await app.waitForSocket()
  await expect(app.sendButton).toBeEnabled()

  await app.mock(`nfts/${EMERALD}`, { price: '1.5' })

  await expect(app.reviewDialog.getByText('Os valores mudaram desde a sua revisão.')).toBeVisible()
  await expect(
    app.reviewDialog.getByText('Total anterior 1.206 ETH', { exact: false }),
  ).toBeVisible()
  await expect(app.sendButton).toBeDisabled()

  await app.reviewDialog.getByRole('button', { name: 'Aceitar novos valores' }).click()
  await expect(app.reviewDialog.getByTestId('total')).toContainText('1.516 ETH')
  await app.sendButton.click()

  await expect(app.orderStatus('confirmed')).toBeVisible()
  await expect(page.getByTestId('receipt-total')).toHaveText('1.516 ETH')
})

test('edição que esgota durante o checkout bloqueia a compra', async ({ app }) => {
  await app.reachReview()
  await app.waitForSocket()

  await app.mock(`nfts/${EMERALD}`, { editions: { '1-50': 0 } })

  await expect(
    app.reviewDialog.getByText('Há itens indisponíveis.', { exact: false }),
  ).toBeVisible()
  await expect(app.sendButton).toBeDisabled()
  expect(await app.orders()).toHaveLength(0)
})

test('o servidor recusa cotação velha mesmo sem o evento ter chegado', async ({ app }) => {
  // neste cenário o preço muda no instante do envio
  await app.reachReview('price-changed')
  await app.sendButton.click()

  await expect(
    app.reviewDialog.getByText('Os valores mudaram.', { exact: false }).first(),
  ).toBeVisible()
  await expect(app.page).toHaveURL(/\/checkout$/)
  expect(await app.orders()).toHaveLength(0)
})

test('carrinho aberto reflete a mudança e avisa', async ({ app, page }) => {
  await app.addToCart()
  await app.waitForSocket()
  await expect(app.total).toContainText('1.206 ETH')

  await app.mock(`nfts/${EMERALD}`, { price: '2.5' })

  await expect(
    page.getByText('O preço de Emerald Ape #042 mudou de 1.19 para 2.50 ETH.').first(),
  ).toBeVisible()
  await expect(app.total).toContainText('2.516 ETH')
})
