import { setupWorker } from 'msw/browser'
import { getDb, invalidateDbCache, resetDb, STORAGE_KEY } from './db/store.ts'
import { resumePendingOrders } from './domain/orders.ts'
import { handlers } from './handlers/index.ts'
import { setScenario } from './network.ts'
import { isScenario } from './scenarios.ts'

/** ?reset=1 restaura os fixtures; ?scenario=nome troca o cenário sem apagar os dados. */
function applyUrlOptions() {
  const url = new URL(window.location.href)
  const scenario = url.searchParams.get('scenario')
  if (url.searchParams.has('reset')) {
    resetDb(isScenario(scenario) ? scenario : 'default')
    url.searchParams.delete('reset')
    window.history.replaceState(null, '', url)
  } else if (isScenario(scenario) && scenario !== getDb().scenario) {
    setScenario(scenario)
  }
}

export async function startMockServer() {
  applyUrlOptions()
  // outra aba alterou o "banco": descarta a cópia em memória
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) invalidateDbCache()
  })
  await setupWorker(...handlers).start({ onUnhandledRequest: 'bypass', quiet: true })
  resumePendingOrders()
}
