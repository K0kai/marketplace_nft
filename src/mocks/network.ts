import { delay, http, HttpResponse } from 'msw'
import { getDb, saveDb } from './db/store.ts'
import { createRandom } from './fixtures/random.ts'
import { apiError } from './http.ts'
import { DEFAULT_LATENCY_MS, SLOW_LATENCY_MS, type ScenarioName } from './scenarios.ts'

let random = createRandom(7)
let catalogCalls = 0
const failedOnce = new Set<string>()

export function resetNetworkState() {
  random = createRandom(7)
  catalogCalls = 0
  failedOnce.clear()
}

export function setScenario(name: ScenarioName) {
  const db = getDb()
  db.scenario = name
  db.fired = []
  resetNetworkState()
  saveDb()
}

function latencyFor(scenario: ScenarioName, path: string): number {
  switch (scenario) {
    case 'slow':
      return SLOW_LATENCY_MS
    case 'variable-latency':
      return 100 + Math.floor(random() * 1500)
    case 'out-of-order':
      // ímpares demoram, pares são rápidas: a resposta antiga chega depois da nova
      if (path.endsWith('/api/nfts')) return ++catalogCalls % 2 === 1 ? 1500 : 100
      return DEFAULT_LATENCY_MS
    default:
      return DEFAULT_LATENCY_MS
  }
}

/** Primeiro handler da fila: simula a rede e, se não falhar, deixa a requisição seguir. */
export const networkHandler = http.all('*/api/*', async ({ request }) => {
  const { scenario } = getDb()
  const path = new URL(request.url).pathname
  const isRead = request.method === 'GET'
  const isAuth = path.includes('/api/auth/')

  await delay(latencyFor(scenario, path))

  if (scenario === 'offline') return HttpResponse.error()
  if (scenario === 'server-error' && isRead && !isAuth) {
    return apiError(500, 'INTERNAL', 'Erro interno simulado.')
  }
  if (scenario === 'catalog-error' && path.endsWith('/api/nfts')) {
    return apiError(503, 'UNAVAILABLE', 'Catálogo temporariamente indisponível.')
  }
  if (scenario === 'flaky' && isRead && !isAuth && !failedOnce.has(path)) {
    failedOnce.add(path)
    return apiError(503, 'UNAVAILABLE', 'Falha transitória simulada. Tente novamente.')
  }
  return undefined
})
