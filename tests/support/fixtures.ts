import { test as base, expect, type Locator, type Page } from '@playwright/test'

export const USERS = {
  nova: { email: 'nova@kurio.test', password: 'Kurio@2026', name: 'Nova Sato' },
  leo: { email: 'leo@kurio.test', password: 'Colecionador@1', name: 'Leo Martins' },
}

export const EMERALD = 'emerald-ape-042'

type MockEvent = {
  eventId: string
  type: string
  version: number
  userId: string | null
  resource: { type: string; id: string }
  payload: Record<string, unknown>
}

/**
 * Apoio dos testes. O bastidor é controlado por HTTP (rotas /__mock/* do MSW);
 * nada aqui mexe no estado da interface.
 */
export class App {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  get isMobile() {
    return (this.page.viewportSize()?.width ?? 0) < 768
  }

  async mock<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.page.evaluate(
      async ([path, body]) => {
        const response = await fetch(`/__mock/${path}`, {
          method: body === undefined ? 'GET' : 'POST',
          body: body === undefined ? undefined : JSON.stringify(body),
        })
        if (!response.ok) throw new Error(`mock ${path}: ${response.status}`)
        return response.status === 204 ? undefined : await response.json()
      },
      [path, body] as const,
    ) as Promise<T>
  }

  events = async () => (await this.mock<{ items: MockEvent[] }>('events')).items

  async orders() {
    const state = await this.mock<{ orders: { id: string; userId: string; status: string }[] }>(
      'state',
    )
    return state.orders.filter((order) => order.userId === 'user-nova')
  }

  /** Só segue quando o socket.io-client estiver conectado ao mock. */
  async waitForSocket() {
    await expect
      .poll(async () => (await this.mock<{ socketClients: number }>('state')).socketClients)
      .toBeGreaterThan(0)
  }

  /** Escolhe o cenário pela URL e só segue depois que o mock respondeu a primeira chamada. */
  async useScenario(name: string, path = '/') {
    const ready = this.page.waitForResponse((response) => response.url().includes('/api/'))
    await this.page.goto(`${path}?scenario=${name}`)
    await ready
  }

  heading(name: string | RegExp) {
    return this.page.getByRole('heading', { name })
  }

  get emailInput() {
    return this.page.getByRole('textbox', { name: 'E-mail', exact: true })
  }

  get passwordInput() {
    return this.page.locator('input[autocomplete="current-password"]')
  }

  /** Preenche o formulário de login já aberto. */
  async submitLogin(user: { email: string; password: string }) {
    await this.emailInput.fill(user.email)
    await this.passwordInput.fill(user.password)
    await this.passwordInput.press('Enter')
  }

  async login(user: { email: string; password: string } = USERS.nova, redirect = '/') {
    await this.page.goto(`/login?redirect=${encodeURIComponent(redirect)}`)
    await this.submitLogin(user)
    await this.page.waitForURL((url) => !url.pathname.startsWith('/login'))
  }

  async logout() {
    await this.page.goto('/profile')
    await this.page.getByRole('button', { name: 'Sair' }).click()
    await expect(this.page.getByText('Você saiu da conta.')).toBeVisible()
  }

  async openNft(id = EMERALD, query = '') {
    await this.page.goto(`/nft/${id}${query}`)
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible()
  }

  get buyButton() {
    return this.page.getByRole('button', { name: /^(Comprar|Comprar NFT)$/ })
  }

  async addToCart(id = EMERALD) {
    await this.openNft(id)
    await this.buyButton.click()
    await this.page.waitForURL('**/cart')
    await expect(this.total).toBeVisible()
  }

  get total(): Locator {
    return this.page.getByTestId('total')
  }

  async openCheckout() {
    await this.page.goto('/checkout')
    await expect(this.page.getByRole('button', { name: 'Conectar carteira' })).toBeVisible()
    await expect(this.total).toBeVisible()
  }

  async connectWallet() {
    await this.page.getByRole('button', { name: 'Conectar carteira' }).click()
    await expect(this.page.getByRole('button', { name: 'Desconectar' })).toBeVisible()
  }

  get reviewDialog() {
    return this.page.getByRole('dialog', { name: 'Revise seu pedido' })
  }

  async openReview() {
    await this.connectWallet()
    await this.page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(this.reviewDialog).toBeVisible()
  }

  get sendButton() {
    return this.reviewDialog.getByRole('button', { name: 'Enviar pedido' })
  }

  /** Do zero até a revisão: carrinho com o Emerald Ape e sessão da Nova. */
  async reachReview(scenario?: string) {
    if (scenario) await this.useScenario(scenario)
    await this.login()
    await this.addToCart()
    await this.openCheckout()
    await this.openReview()
  }

  orderStatus(status: 'pending' | 'confirmed' | 'declined') {
    return this.page.locator(`[data-status="${status}"]`)
  }
}

export const test = base.extend<{ app: App; pageErrors: string[] }>({
  // qualquer exceção não tratada na página reprova o teste
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await use(errors)
      expect(errors, 'exceções não tratadas na página').toEqual([])
    },
    { auto: true },
  ],
  app: async ({ page }, use) => {
    await use(new App(page))
  },
})

export { expect }
