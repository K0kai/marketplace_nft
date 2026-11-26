import { expect, test, type App } from '../support/fixtures'

/** No desktop os filtros são a barra lateral; no celular ficam num painel. */
async function withFilters(app: App, action: () => Promise<void>) {
  if (!app.isMobile) return action()
  await app.page.getByRole('button', { name: 'Abrir filtros' }).click()
  const sheet = app.page.getByRole('dialog', { name: 'Filtros' })
  await action()
  await app.page.keyboard.press('Escape')
  await expect(sheet).toBeHidden()
}

async function search(app: App, term: string) {
  if (app.isMobile) {
    const input = app.page.getByRole('searchbox', { name: 'Explorar coleções' })
    await input.fill(term)
    await input.press('Enter')
  } else {
    await app.page.getByRole('button', { name: 'Buscar NFTs' }).click()
    await app.page.getByRole('searchbox', { name: 'Termo de busca' }).fill(term)
    await app.page.keyboard.press('Enter')
  }
}

async function chooseSort(app: App, label: string) {
  await app.page.getByRole('combobox', { name: 'Ordenar por:' }).click()
  await app.page.getByRole('option', { name: label }).click()
  // só segue com a lista fechada: enquanto ela existe, é ela quem recebe o Escape
  await expect(app.page.getByRole('listbox')).toHaveCount(0)
  await expect(app.page.getByRole('combobox', { name: 'Ordenar por:' })).toHaveText(label)
}

const cards = (app: App) => app.page.getByRole('article')
const prices = async (app: App) =>
  (await cards(app).locator('p > span').allInnerTexts()).map((text) => Number.parseFloat(text))

test('filtros, ordenação e paginação vivem na URL e sobrevivem a refresh e histórico', async ({
  app,
  page,
}) => {
  await page.goto('/')
  await expect(cards(app)).toHaveCount(9)

  await page.getByRole('link', { name: 'Página 2' }).click()
  await expect(page).toHaveURL(/page=2/)

  // mudar um filtro volta para a primeira página
  await withFilters(app, () => page.getByRole('button', { name: /^Música/ }).click())
  await expect(page).toHaveURL(/category=music/)
  await expect(page).not.toHaveURL(/page=/)
  await expect(cards(app)).toHaveCount(8)

  await withFilters(app, () => chooseSort(app, 'Menor preço'))
  await expect(page).toHaveURL(/sort=price-asc/)
  await expect
    .poll(async () => {
      const list = await prices(app)
      return list.length === 8 && list.every((value, i) => i === 0 || value >= list[i - 1]!)
    })
    .toBe(true)

  await withFilters(app, () => page.getByRole('button', { name: /^Polygon/ }).click())
  await expect(page).toHaveURL(/network=polygon/)
  await expect(cards(app)).toHaveCount(3)

  await page.reload()
  await expect(cards(app)).toHaveCount(3)
  await withFilters(app, () =>
    expect(page.getByRole('button', { name: /Música/ })).toHaveAttribute('aria-pressed', 'true'),
  )

  await page.goBack()
  await expect(page).not.toHaveURL(/network=/)
  await expect(cards(app)).toHaveCount(8)
  await page.goForward()
  await expect(cards(app)).toHaveCount(3)
})

test('busca envia o termo à API e mostra o estado vazio', async ({ app, page }) => {
  await page.goto('/')
  await expect(cards(app)).toHaveCount(9)

  await search(app, 'golden')
  await expect(page).toHaveURL(/q=golden/)
  await expect(cards(app)).toHaveCount(3)

  await search(app, 'nada-com-esse-nome')
  await expect(app.heading('Nenhum NFT encontrado')).toBeVisible()
  await page.getByRole('button', { name: 'Limpar filtros' }).last().click()
  await expect(cards(app)).toHaveCount(9)
})

test('resposta antiga que chega atrasada não sobrescreve a busca atual', async ({ app, page }) => {
  await page.goto('/?scenario=out-of-order')
  await expect(cards(app)).toHaveCount(9)

  // chamadas ímpares demoram 1,5 s: a primeira busca daqui responde depois da segunda
  await search(app, 'nomad')
  await expect(page).toHaveURL(/q=nomad/)
  await search(app, 'golden')
  await expect(cards(app)).toHaveCount(3)

  // espera passar o atraso da resposta antiga e confere que nada mudou
  await page.waitForTimeout(2000)
  await expect(cards(app)).toHaveCount(3)
  await expect(page.getByRole('heading', { level: 3, name: /Golden/ })).toHaveCount(3)
})

test('catálogo vazio vindo da API tem estado próprio', async ({ app, page }) => {
  await page.goto('/?scenario=empty-catalog')
  await expect(app.heading('Nenhum NFT encontrado')).toBeVisible()
})
