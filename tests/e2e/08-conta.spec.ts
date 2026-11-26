import { expect, test, USERS } from '../support/fixtures'

// PNG de 1x1 pixel
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
  'base64',
)

test('perfil: validação local, erro da API, avatar e persistência', async ({ app, page }) => {
  await app.login(USERS.nova, '/profile')
  const displayName = page.getByRole('textbox', { name: 'Nome de exibição' })
  const email = page.getByRole('textbox', { name: 'E-mail' }).first()
  const save = page.getByRole('button', { name: 'Salvar' })
  await expect(displayName).toHaveValue('Nova Sato')

  await displayName.fill('')
  await save.click()
  await expect(displayName).toHaveAttribute('aria-invalid', 'true')

  await displayName.fill('Nova S.')
  await email.fill(USERS.leo.email)
  await save.click()
  await expect(email).toHaveAccessibleDescription('Este e-mail já está em uso.')

  await email.fill(USERS.nova.email)
  await save.click()
  await expect(page.getByText('Perfil salvo.')).toBeVisible()

  const file = page.getByLabel('Escolher imagem de avatar')
  await file.setInputFiles({ name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('x') })
  await expect(page.getByRole('alert').filter({ hasText: 'PNG, JPG ou WebP' })).toBeVisible()
  await file.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PIXEL })
  await expect(page.getByRole('img', { name: 'Seu avatar atual' })).toBeVisible()

  await page.reload()
  await expect(displayName).toHaveValue('Nova S.')
  await expect(page.getByRole('img', { name: 'Seu avatar atual' })).toBeVisible()
})

test('troca de senha valida a atual e passa a valer no próximo login', async ({ app, page }) => {
  await app.login(USERS.nova, '/profile')
  const current = page.getByLabel('Senha atual', { exact: true })
  const next = page.getByLabel('Nova senha', { exact: true })
  const confirm = page.getByLabel('Confirmar nova senha', { exact: true })
  const save = page.getByRole('button', { name: 'Salvar' })

  await current.fill('errada-123')
  await next.fill('NovaSenha@2027')
  await confirm.fill('NovaSenha@2027')
  await save.click()
  await expect(current).toHaveAccessibleDescription('Senha atual incorreta.')

  await current.fill(USERS.nova.password)
  await save.click()
  await expect(page.getByText('Senha alterada.')).toBeVisible()

  await app.logout()
  await page.goto('/login')
  await app.submitLogin(USERS.nova)
  await expect(page.getByRole('alert').filter({ hasText: 'incorretos' })).toBeVisible()
  await app.submitLogin({ email: USERS.nova.email, password: 'NovaSenha@2027' })
  await expect(page).not.toHaveURL(/\/login/)
})

test('carteiras: editar a principal e cadastrar a secundária', async ({ app, page }) => {
  await app.login(USERS.leo, '/profile/wallets')
  const primary = page.getByRole('form', { name: 'Carteira principal' })
  const address = primary.getByRole('textbox', { name: 'Endereço da carteira' })
  const original = await address.inputValue()

  await address.fill('0x123')
  await primary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(address).toHaveAttribute('aria-invalid', 'true')

  await address.fill(original)
  await primary.getByRole('textbox', { name: 'Nome do perfil' }).fill('Leo na Kurio')
  await primary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira principal salva.')).toBeVisible()

  await expect(page.getByText('Você ainda não adicionou uma carteira secundária.')).toBeVisible()
  await page.getByRole('checkbox', { name: 'Igual à carteira principal' }).click()
  await page.getByRole('button', { name: 'Adicionar carteira secundária' }).click()
  const secondary = page.getByRole('form', { name: 'Carteira secundária' })
  await expect(secondary.getByRole('textbox', { name: 'Endereço da carteira' })).toHaveValue(
    original,
  )
  await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira secundária salva.')).toBeVisible()

  await page.reload()
  await expect(primary.getByRole('textbox', { name: 'Nome do perfil' })).toHaveValue('Leo na Kurio')
  await expect(secondary.getByRole('textbox', { name: 'Apelido da carteira' })).toHaveValue(
    'Reserva',
  )
})
