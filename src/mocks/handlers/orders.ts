import { delay, http, HttpResponse } from 'msw'
import { createOrderSchema } from '../../api/contracts/index.ts'
import { getDb, saveDb } from '../db/store.ts'
import { createOrder, settleIfDue, toPublicOrder } from '../domain/orders.ts'
import { apiError, notFound, readBody, requireAuth } from '../http.ts'

export const orderHandlers = [
  http.get('*/api/orders', ({ request }) => {
    const { userId } = requireAuth(request)
    const status = new URL(request.url).searchParams.get('status')
    for (const order of getDb().orders) settleIfDue(order.id)
    const items = getDb()
      .orders.filter((o) => o.userId === userId && (!status || o.status === status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toPublicOrder)
    return HttpResponse.json({ items })
  }),

  http.post('*/api/orders', async ({ request }) => {
    const { userId } = requireAuth(request)
    const key = request.headers.get('idempotency-key')
    if (!key) return apiError(422, 'VALIDATION_ERROR', 'Cabeçalho Idempotency-Key obrigatório.')

    const input = await readBody(request, createOrderSchema)
    const { order, replayed } = createOrder(userId, key, input)

    const db = getDb()
    if (!replayed && db.scenario === 'order-timeout' && !db.fired.includes('order-timeout')) {
      db.fired.push('order-timeout')
      saveDb()
      // o pedido já existe, mas o cliente nunca recebe a resposta
      await delay('infinite')
    }

    return HttpResponse.json(toPublicOrder(order), {
      status: replayed ? 200 : 201,
      headers: replayed ? { 'Idempotent-Replayed': 'true' } : undefined,
    })
  }),

  http.get('*/api/orders/:id', ({ request, params }) => {
    const { userId } = requireAuth(request)
    const id = String(params.id)
    settleIfDue(id)
    const order = getDb().orders.find((o) => o.id === id)
    if (!order) return notFound('Pedido não encontrado.')
    if (order.userId !== userId) {
      return apiError(403, 'FORBIDDEN', 'Este pedido pertence a outra conta.')
    }
    return HttpResponse.json(toPublicOrder(order))
  }),
]
