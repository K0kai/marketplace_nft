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

let activation: Promise<void> | null = null

function activateWorker() {
  const { serviceWorker } = navigator
  const worker = serviceWorker.controller
  if (!worker) return Promise.resolve()

  return new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timeout)
      serviceWorker.removeEventListener('message', onMessage)
      resolve()
    }
    const onMessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === 'MOCKING_ENABLED') done()
    }
    // sem resposta, segue mesmo assim: um erro visível é melhor que uma tela presa
    const timeout = setTimeout(done, 1000)
    serviceWorker.addEventListener('message', onMessage)
    worker.postMessage('MOCK_ACTIVATE')
  })
}

/**
 * O navegador pode encerrar um Service Worker ocioso. Ao voltar, ele esquece quais abas atendia
 * e deixa as requisições irem para a rede. Por isso confirmamos a ativação antes de cada chamada.
 */
export function ensureMockActive() {
  activation ??= activateWorker().finally(() => {
    activation = null
  })
  return activation
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
