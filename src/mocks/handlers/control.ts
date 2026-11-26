import { http, HttpResponse } from 'msw'
import type { EditionId, RealtimeEvent } from '../../api/contracts/index.ts'
import { getDb, resetDb, saveDb } from '../db/store.ts'
import { updateNft } from '../domain/nft.ts'
import { settleOrder } from '../domain/orders.ts'
import { apiError, notFound } from '../http.ts'
import { resetNetworkState, setScenario } from '../network.ts'
import { deliver, socketControl } from '../realtime.ts'
import { isScenario, SCENARIOS } from '../scenarios.ts'

// Rotas de bastidor para a página /demo e para o Playwright. Não fazem parte da API do produto.

const body = async <T>(request: Request) => (await request.json().catch(() => ({}))) as T

const state = () => ({
  scenario: getDb().scenario,
  scenarios: SCENARIOS,
  socketClients: socketControl.connectedCount(),
  orders: getDb().orders.map(({ id, userId, status }) => ({ id, userId, status })),
})

export const controlHandlers = [
  http.get('*/__mock/state', () => HttpResponse.json(state())),

  http.post('*/__mock/scenario', async ({ request }) => {
    const { name } = await body<{ name?: unknown }>(request)
    if (!isScenario(name)) return apiError(422, 'VALIDATION_ERROR', 'Cenário desconhecido')
    setScenario(name)
    return HttpResponse.json(state())
  }),

  http.post('*/__mock/reset', async ({ request }) => {
    const { scenario } = await body<{ scenario?: unknown }>(request)
    resetDb(isScenario(scenario) ? scenario : 'default')
    resetNetworkState()
    socketControl.clearHistory()
    socketControl.setOffline(false)
    return HttpResponse.json(state())
  }),

  http.post('*/__mock/nfts/:id', async ({ request, params }) => {
    const change = await body<{ price?: string; editions?: Partial<Record<EditionId, number>> }>(
      request,
    )
    const nft = updateNft(String(params.id), change)
    return nft ? HttpResponse.json({ version: nft.version }) : notFound()
  }),

  http.get('*/__mock/events', () => HttpResponse.json({ items: socketControl.history() })),

  // reentrega um evento arbitrário: usado para duplicatas e eventos fora de ordem
  http.post('*/__mock/emit', async ({ request }) => {
    deliver(await body<RealtimeEvent>(request))
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/__mock/socket', async ({ request }) => {
    const { action } = await body<{ action?: string }>(request)
    if (action === 'disconnect') socketControl.disconnectAll()
    else if (action === 'offline') socketControl.setOffline(true)
    else if (action === 'online') socketControl.setOffline(false)
    else return apiError(422, 'VALIDATION_ERROR', 'Ação desconhecida')
    return HttpResponse.json(state())
  }),

  http.post('*/__mock/orders/:id/settle', async ({ request, params }) => {
    const { outcome } = await body<{ outcome?: 'confirmed' | 'declined' }>(request)
    const order = settleOrder(String(params.id), outcome ?? 'confirmed')
    return order ? HttpResponse.json({ status: order.status }) : notFound()
  }),

  http.post('*/__mock/session/expire', () => {
    const db = getDb()
    for (const session of Object.values(db.sessions)) session.expiresAt = 0
    saveDb()
    return new HttpResponse(null, { status: 204 })
  }),
]
