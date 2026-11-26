import { EMERALD, expect, test, USERS } from '../support/fixtures'

test('quantidade, cupom, persistência e preservação do carrinho no login', async ({
  app,
  page,
}) => {
  await app.addToCart(EMERALD)
  await app.addToCart('violet-nomad-314')
  await expect(app.total).toContainText('2.596 ETH')

  await page.getByRole('button', { name: /^Aumentar quantidade de Emerald/ }).click()
  await expect(page.getByTestId('subtotal')).toContainText('3.77 ETH')
  await expect(app.total).toContainText('3.786 ETH')

  const coupon = page.getByRole('textbox', { name: 'Código promocional' })
  const apply = page.getByRole('button', { name: 'Aplicar' })

  await coupon.fill('NAOEXISTE')
  await apply.click()
  await expect(coupon).toHaveAttribute('aria-invalid', 'true')
  await expect(coupon).toHaveAccessibleDescription(/inválido/i)

  await coupon.fill('GENESIS2025')
  await apply.click()
  await expect(coupon).toHaveAccessibleDescription(/expirad|expirou/i)

  await coupon.fill('KURIO10')
  await apply.click()
  await expect(page.getByTestId('discount')).toContainText('0.377 ETH')
  await expect(app.total).toContainText('3.409 ETH')

  await page.reload()
  await expect(app.total).toContainText('3.409 ETH')

  await app.login(USERS.nova, '/cart')
  await expect(
    page.getByRole('region', { name: 'Itens no carrinho' }).getByRole('listitem'),
  ).toHaveCount(2)
  await expect(app.total).toContainText('3.409 ETH')

  await page.getByRole('button', { name: 'Remover cupom' }).click()
  await expect(app.total).toContainText('3.786 ETH')

  await page
    .getByRole('button', { name: /^Remover Violet Nomad/ })
    .locator('visible=true')
    .click()
  await expect(app.total).toContainText('2.396 ETH')
  await page
    .getByRole('button', { name: /^Remover Emerald Ape/ })
    .locator('visible=true')
    .click()
  await expect(app.heading('Seu carrinho está vazio')).toBeVisible()
})
