import { expect, test, USERS } from '../support/fixtures'

test('skeletons durante a lentidão, sem salto de layout quando o conteúdo chega', async ({
  page,
}) => {
  await page.goto('/?scenario=slow')
  const loading = page.getByRole('status').filter({ hasText: 'Carregando NFTs' })
  await expect(loading).toBeVisible()

  const placeholder = await loading.locator('[data-slot="skeleton"]').first().boundingBox()
  await expect(page.getByRole('article')).toHaveCount(9)
  const image = await page.getByRole('article').first().locator('img').boundingBox()

  expect(Math.abs(image!.width - placeholder!.width)).toBeLessThanOrEqual(2)
  expect(Math.abs(image!.height - placeholder!.height)).toBeLessThanOrEqual(2)
  expect(Math.abs(image!.x - placeholder!.x)).toBeLessThanOrEqual(2)
})

test('shimmer respeita a preferência por menos movimento', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/nft/emerald-ape-042?scenario=slow')
  const skeleton = page.locator('[data-slot="skeleton"]').first()
  await expect(skeleton).toBeVisible()
  expect(await skeleton.evaluate((node) => getComputedStyle(node, '::after').display)).toBe('none')
})

test('falha do catálogo mostra o erro e se recupera ao tentar de novo', async ({ app, page }) => {
  await page.goto('/?scenario=catalog-error')
  const alert = page.getByRole('alert').filter({ hasText: 'Não foi possível carregar o catálogo' })
  await expect(alert).toBeVisible({ timeout: 15_000 })

  await app.mock('scenario', { name: 'default' })
  await alert.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('article')).toHaveCount(9)
})

test('falha passageira é repetida automaticamente', async ({ page }) => {
  await page.goto('/?scenario=flaky')
  await expect(page.getByRole('article')).toHaveCount(9)
})

test('sem conexão o usuário vê o motivo', async ({ page }) => {
  await page.goto('/?scenario=offline')
  await expect(page.getByText('Sem conexão com o servidor.', { exact: false }).first()).toBeVisible(
    {
      timeout: 20_000,
    },
  )
})

test('erro 500 no detalhe tem nova tentativa', async ({ app, page }) => {
  await page.goto('/nft/emerald-ape-042?scenario=server-error')
  const retry = page.getByRole('button', { name: 'Tentar novamente' }).first()
  await expect(retry).toBeVisible({ timeout: 15_000 })

  await app.mock('scenario', { name: 'default' })
  await retry.click()
  await expect(app.heading('Emerald Ape #042')).toBeVisible()
})

test('o mock continua respondendo depois que o navegador encerra o Service Worker', async ({
  app,
  page,
}) => {
  await page.goto('/login')
  // no celular o login não chama a API ao abrir: espera o mock responder (sem ele, viria o HTML)
  await expect
    .poll(() =>
      page.evaluate(async () =>
        (await fetch('/__mock/state')).headers.get('content-type')?.includes('json'),
      ),
    )
    .toBe(true)

  // é o que o navegador faz com um worker ocioso, por exemplo numa aba em segundo plano
  const devtools = await page.context().newCDPSession(page)
  await devtools.send('ServiceWorker.enable')
  await devtools.send('ServiceWorker.stopAllWorkers')

  const login = page.waitForResponse((response) => response.url().endsWith('/api/auth/login'))
  await app.submitLogin(USERS.nova)

  expect((await login).status()).toBe(200)
  await expect(page).toHaveURL('/')
})
