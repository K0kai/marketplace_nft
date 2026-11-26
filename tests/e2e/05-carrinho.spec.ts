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

// nas larguras intermediárias o resumo já espremeu a lista e sumiu com o nome
for (const width of [768, 1024, 1440]) {
  test(`itens legíveis e sem sobreposição em ${width}px`, async ({ app, page, isMobile }) => {
    test.skip(isMobile, 'a largura é definida pelo próprio teste')
    await page.setViewportSize({ width, height: 900 })
    await app.addToCart(EMERALD)

    const item = page.getByRole('region', { name: 'Itens no carrinho' }).getByRole('listitem')
    const name = item.getByRole('heading', { name: 'Emerald Ape #042' })
    await expect(name).toBeVisible()

    const problems = await item.evaluate((row) => {
      const cells = [...row.children]
        .map((cell) => ({ cell, box: cell.getBoundingClientRect() }))
        .filter(({ box }) => box.width > 0)
      const overflowing = cells
        .filter(({ cell }) => cell.scrollWidth > cell.clientWidth + 1)
        .map(({ cell }) => `estoura: ${cell.textContent}`)
      const overlapping = cells
        .slice(1)
        .filter(({ box }, i) => box.left < cells[i]!.box.right - 1)
        .map(({ cell }) => `sobrepõe: ${cell.textContent}`)
      return [...overflowing, ...overlapping]
    })
    expect(problems).toEqual([])
    expect((await name.boundingBox())!.width).toBeGreaterThan(100)
  })
}
