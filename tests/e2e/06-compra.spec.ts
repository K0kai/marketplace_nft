import { EMERALD, expect, test, USERS } from '../support/fixtures'

test('compra completa: do catálogo ao recibo confirmado', async ({ app, page }) => {
  await page.goto('/')
  await page.getByRole('heading', { name: 'Emerald Ape #042' }).getByRole('link').click()
  await expect(page).toHaveURL(new RegExp(`/nft/${EMERALD}`))
  await app.buyButton.click()
  await page.waitForURL('**/cart')

  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL(/\/login\?redirect=%2Fcheckout/)
  await app.submitLogin(USERS.nova)
  await expect(page).toHaveURL(/\/checkout$/)

  // sem carteira conectada não há revisão
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Conecte a carteira' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Conectar carteira' })).toBeFocused()

  await app.openReview()
  await expect(app.reviewDialog).toContainText('1.206 ETH')
  await app.sendButton.click()

  await expect(page).toHaveURL(/\/orders\//)
  // a confirmação só aparece depois que a simulação confirma
  await expect(app.orderStatus('pending')).toBeVisible()
  await expect(app.heading('Seus NFTs agora estão na sua carteira')).toBeHidden()
  await expect(app.orderStatus('confirmed')).toBeVisible()
  await expect(app.heading('Seus NFTs agora estão na sua carteira')).toBeVisible()
  await expect(page.getByTestId('receipt-total')).toHaveText('1.206 ETH')

  // o recibo é um retrato do pedido: mudar o catálogo depois não o altera
  await app.mock(`nfts/${EMERALD}`, { price: '9.99' })
  await page.reload()
  await expect(page.getByTestId('receipt-total')).toHaveText('1.206 ETH')

  await page.getByRole('link', { name: 'Ver no Etherscan' }).click()
  await expect(app.heading('Transação fictícia')).toBeVisible()

  await page.goto('/cart')
  await expect(app.heading('Seu carrinho está vazio')).toBeVisible()
})
