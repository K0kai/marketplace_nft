import AxeBuilder from '@axe-core/playwright'
import { EMERALD, expect, test } from '../support/fixtures'

test('link para pular ao conteúdo é o primeiro foco', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('article')).toHaveCount(9)
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
  await expect(skip).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#conteudo')).toBeFocused()
})

test('diálogo prende o foco e o devolve a quem abriu', async ({ app, page }) => {
  await page.goto('/')
  await expect(page.getByRole('article')).toHaveCount(9)
  const trigger = page.getByRole('button', { name: app.isMobile ? 'Abrir filtros' : 'Buscar NFTs' })

  await trigger.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true)
  }

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('formulário: erros ligados aos campos e foco no primeiro inválido', async ({ app, page }) => {
  await page.goto('/login')
  await app.emailInput.focus()
  await page.keyboard.press('Enter')

  await expect(app.emailInput).toBeFocused()
  await expect(app.emailInput).toHaveAttribute('aria-invalid', 'true')
  await expect(app.emailInput).toHaveAccessibleDescription(/.+/)
  await expect(app.passwordInput).toHaveAttribute('aria-invalid', 'true')
})

test('compra possível só pelo teclado a partir do detalhe', async ({ app, page }) => {
  await app.openNft()
  await page.getByRole('radio', { name: '1/50' }).focus()
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByRole('radio', { name: '1/10' })).toBeFocused()
  await page.keyboard.press('Space')
  await expect(page).toHaveURL(/edition=1-10/)

  await app.buyButton.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/cart$/)
})

const PAGES = [
  ['home', '/'],
  ['detalhe', `/nft/${EMERALD}`],
  ['login', '/login'],
] as const

for (const [name, path] of PAGES) {
  test(`sem violações do axe: ${name}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(path)
    await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0)
    await page.waitForTimeout(300)
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  })
}

test('sem violações do axe: carrinho, checkout, perfil e carteiras', async ({ app, page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await app.login()
  await app.addToCart()

  for (const path of ['/cart', '/checkout', '/profile', '/profile/wallets']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeAttached()
    await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0)
    await page.waitForTimeout(300)
    const result = await new AxeBuilder({ page }).exclude('[data-sonner-toaster]').analyze()
    expect(result.violations, path).toEqual([])
  }
})
