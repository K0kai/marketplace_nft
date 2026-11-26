import { expect, test, USERS } from '../support/fixtures'

test('cadastro com validação, conflito da API e sessão que sobrevive ao refresh', async ({
  app,
  page,
}) => {
  await page.goto('/register')
  const username = page.getByRole('textbox', { name: 'Nome de usuário' })
  const confirm = page.getByRole('textbox', { name: 'Confirmar senha' })
  const password = page.getByRole('textbox', { name: 'Senha', exact: true })
  const submit = page.getByRole('button', { name: /^(Criar conta|Criar perfil)$/ })

  await submit.click()
  await expect(username).toHaveAttribute('aria-invalid', 'true')

  await username.fill('colecionadora')
  await app.emailInput.fill(USERS.nova.email)
  await password.fill('Segredo@2026')
  await confirm.fill('outra-coisa')
  await submit.click()
  await expect(page.getByText('As senhas não conferem')).toBeVisible()

  await confirm.fill('Segredo@2026')
  await submit.click()
  await expect(page.getByText('Este e-mail já está cadastrado.')).toBeVisible()

  await app.emailInput.fill('colecionadora@kurio.test')
  await submit.click()
  await expect(page).toHaveURL(/\/$/)

  await page.reload()
  await page.goto('/profile')
  await expect(page.getByRole('textbox', { name: 'Nome de usuário' })).toHaveValue('colecionadora')

  // a senha nunca é guardada em claro
  const stored = await page.evaluate(() => JSON.stringify({ ...window.localStorage }))
  expect(stored).not.toContain('Segredo@2026')
})

test('login inválido e retorno à rota privada pedida', async ({ app, page }) => {
  await page.goto('/profile/wallets')
  await expect(page).toHaveURL(/\/login\?redirect=/)

  await app.submitLogin({ email: USERS.nova.email, password: 'senha-errada-1' })
  await expect(
    page.getByRole('alert').filter({ hasText: 'E-mail ou senha incorretos.' }),
  ).toBeVisible()

  await app.submitLogin(USERS.nova)
  await expect(page).toHaveURL(/\/profile\/wallets$/)
  await expect(app.heading('Carteira principal')).toBeVisible()
})

test('sessão expirada pelo relógio redireciona e permite retomar', async ({ app, page }) => {
  await page.clock.install()
  await app.useScenario('short-session')
  await app.login(USERS.nova, '/profile')
  await expect(page.getByRole('textbox', { name: 'Nome de exibição' })).toHaveValue('Nova Sato')

  // a sessão deste cenário dura 60 s: adiantamos o relógio do navegador
  await page.clock.fastForward('02:00')
  await page.getByRole('link', { name: 'Carteiras', exact: true }).first().click()

  await expect(page).toHaveURL(/\/login\?redirect=.*wallets/)
  await expect(page.getByText('Sua sessão expirou.', { exact: false })).toBeVisible()
  await app.submitLogin(USERS.nova)
  await expect(page).toHaveURL(/\/profile\/wallets$/)
})

test('expiração no checkout preserva o que foi preenchido', async ({ app, page }) => {
  await app.login()
  await app.addToCart()
  await app.openCheckout()

  if (app.isMobile) await page.getByRole('button', { name: 'Dados do colecionador' }).click()
  const note = page.getByRole('textbox', { name: 'Observação do colecionador (opcional)' })
  await note.fill('Entregar depois do lançamento')

  await app.mock('session/expire', {})
  await page.getByRole('button', { name: 'Conectar carteira' }).click()

  await expect(page).toHaveURL(/\/login\?redirect=%2Fcheckout/)
  await app.submitLogin(USERS.nova)
  await expect(page).toHaveURL(/\/checkout$/)
  if (app.isMobile) await page.getByRole('button', { name: 'Dados do colecionador' }).click()
  await expect(note).toHaveValue('Entregar depois do lançamento')
  await expect(app.total).toContainText('1.206 ETH')
})

test('logout e troca de usuário não deixam dados da sessão anterior', async ({ app, page }) => {
  await app.login(USERS.nova, '/profile/favorites')
  await expect(page.getByRole('article')).toHaveCount(2)

  await app.logout()
  await page.goto('/profile')
  await expect(page).toHaveURL(/\/login/)

  await app.submitLogin(USERS.leo)
  await expect(page.getByRole('textbox', { name: 'Nome de exibição' })).toHaveValue('Leo Martins')
  await page.getByRole('link', { name: 'Lista de interesse' }).first().click()
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(page.getByText(USERS.nova.name)).toHaveCount(0)
})

test('pedido de outra conta responde acesso negado', async ({ app }) => {
  await app.login(USERS.nova, '/orders/order-leo-seed')
  await expect(app.heading('Acesso negado')).toBeVisible()
})
