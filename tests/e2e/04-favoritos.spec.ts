import { expect, test, USERS } from '../support/fixtures'

const NAME = 'Emerald Ape #042'

test('visitante é levado ao login ao favoritar', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: `Favoritar ${NAME}` }).click()
  await expect(page).toHaveURL(/\/login\?redirect=/)
})

test('favorito persiste para o usuário autenticado', async ({ app, page }) => {
  await app.login()
  const heart = page.getByRole('button', { name: `Favoritar ${NAME}` })
  await expect(heart).toHaveAttribute('aria-pressed', 'false')

  await heart.click()
  await expect(page.getByText(`${NAME} adicionado aos favoritos.`)).toBeVisible()

  await page.reload()
  await expect(heart).toHaveAttribute('aria-pressed', 'true')
  await page.goto('/profile/favorites')
  await expect(page.getByRole('heading', { name: NAME })).toBeVisible()

  await heart.click()
  await expect(page.getByRole('heading', { name: NAME })).toHaveCount(0)
})

test('falha na API desfaz a atualização otimista e permite tentar de novo', async ({
  app,
  page,
}) => {
  await app.useScenario('favorite-failure')
  await app.login(USERS.nova)
  const heart = page.getByRole('button', { name: `Favoritar ${NAME}` })
  await expect(heart).toHaveAttribute('aria-pressed', 'false')

  // registra cada valor que o botão assumiu: prova o "marcou na hora e voltou"
  await heart.evaluate((button) => {
    const seen: (string | null)[] = []
    Object.assign(window, { __pressed: seen })
    new MutationObserver(() => seen.push(button.getAttribute('aria-pressed'))).observe(button, {
      attributeFilter: ['aria-pressed'],
    })
  })

  await heart.click()
  await expect(
    page.getByText('A alteração em Emerald Ape #042 foi desfeita.', { exact: false }),
  ).toBeVisible()
  await expect(heart).toHaveAttribute('aria-pressed', 'false')
  expect(
    await page.evaluate(() => (window as unknown as { __pressed: string[] }).__pressed),
  ).toEqual(['true', 'false'])

  await app.mock('scenario', { name: 'default' })
  await heart.click()
  await expect(page.getByText(`${NAME} adicionado aos favoritos.`)).toBeVisible()
  await expect(heart).toHaveAttribute('aria-pressed', 'true')
})
