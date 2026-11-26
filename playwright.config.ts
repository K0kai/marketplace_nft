import { defineConfig, devices } from '@playwright/test'

const desktop = { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }
const mobile = { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } }

export default defineConfig({
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  timeout: 45_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  // uma pasta de baseline por projeto e sistema: a renderização de fontes muda entre eles
  snapshotPathTemplate: 'tests/visual/__screenshots__/{projectName}-{platform}/{arg}{ext}',
  expect: {
    timeout: 10_000,
    toHaveScreenshot: { animations: 'disabled', maxDiffPixelRatio: 0.01 },
  },
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    // cada teste nasce num contexto novo: localStorage vazio = mock no estado inicial
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', testDir: 'tests/e2e', use: desktop },
    { name: 'mobile', testDir: 'tests/e2e', use: mobile },
    { name: 'visual-desktop', testDir: 'tests/visual', use: desktop },
    { name: 'visual-mobile', testDir: 'tests/visual', use: mobile },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
