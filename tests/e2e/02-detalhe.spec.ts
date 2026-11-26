import { EMERALD, expect, test } from '../support/fixtures'

test('acesso direto ao detalhe, edição esgotada e limite de quantidade', async ({ app, page }) => {
  await app.openNft(EMERALD, '?edition=1-1')
  await expect(app.heading('Emerald Ape #042')).toBeVisible()
  await expect(page.getByText('A edição 1/1 está esgotada.')).toBeVisible()
  await expect(app.buyButton).toBeDisabled()

  await page.getByRole('radio', { name: '1/10' }).click()
  await expect(page).toHaveURL(/edition=1-10/)
  await expect(app.buyButton).toBeEnabled()

  const increase = page.getByRole('button', { name: /^Aumentar quantidade/ })
  await increase.click()
  await increase.click()
  // a edição 1/10 permite 3 por pedido
  await expect(increase).toBeDisabled()

  // com o limite já no carrinho, não dá para adicionar mais
  await app.buyButton.click()
  await page.waitForURL('**/cart')
  await app.openNft(EMERALD, '?edition=1-10')
  await expect(page.getByText('Você já tem no carrinho o limite desta edição (3).')).toBeVisible()
  await expect(app.buyButton).toBeDisabled()
})

test('NFT inexistente e rota inexistente têm telas próprias', async ({ app, page }) => {
  await page.goto('/nft/nao-existe')
  await expect(app.heading('NFT não encontrado')).toBeVisible()
  await page.getByRole('link', { name: 'Explorar o catálogo' }).click()
  await expect(page.getByRole('article')).toHaveCount(9)

  await page.goto('/uma/rota/qualquer')
  await expect(app.heading('Página não encontrada')).toBeVisible()
})
