import type { Page } from '@playwright/test'
import { expect, test } from '../support/fixtures'

/** Só fotografa com tudo estável: sem skeletons, fontes e imagens carregadas, sem toasts. */
async function settle(page: Page) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0)
  await page.evaluate(async () => {
    await document.fonts.ready
    for (const image of document.images) {
      image.loading = 'eager'
      await image.decode().catch(() => undefined)
    }
  })
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(0, { timeout: 10_000 })
  await page.mouse.move(0, 0)
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('início', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('article')).toHaveCount(9)
  await settle(page)
  await expect(page).toHaveScreenshot('inicio.png', { fullPage: true })
})

test('detalhe do NFT', async ({ app, page }) => {
  await app.openNft()
  await expect(page.getByRole('article').first()).toBeVisible()
  await settle(page)
  await expect(page).toHaveScreenshot('detalhe.png', { fullPage: true })
})

test('carrinho', async ({ app, page }) => {
  await app.addToCart()
  await app.addToCart('violet-nomad-314')
  // recarrega para limpar avisos temporários da inclusão
  await page.reload()
  await expect(app.total).toContainText('2.596 ETH')
  await settle(page)
  await expect(page).toHaveScreenshot('carrinho.png', { fullPage: true })
})

test('pagamento', async ({ app, page }) => {
  await app.login()
  await app.addToCart()
  await page.goto('/checkout')
  await expect(page.getByRole('button', { name: 'Conectar carteira' })).toBeVisible()
  await expect(app.total).toContainText('1.206 ETH')
  await settle(page)
  await expect(page).toHaveScreenshot('pagamento.png', { fullPage: true })
})
