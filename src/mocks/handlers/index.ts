import { http } from 'msw'
import { notFound } from '../http.ts'
import { networkHandler } from '../network.ts'
import { realtimeHandlers } from '../realtime.ts'
import { accountHandlers } from './account.ts'
import { cartHandlers } from './cart.ts'
import { catalogHandlers } from './catalog.ts'
import { controlHandlers } from './control.ts'
import { favoriteHandlers } from './favorites.ts'
import { orderHandlers } from './orders.ts'
import { sessionHandlers } from './session.ts'

export const handlers = [
  ...controlHandlers,
  networkHandler,
  ...sessionHandlers,
  ...catalogHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...orderHandlers,
  ...accountHandlers,
  // rota de API inexistente responde 404 em JSON, e não o index.html do servidor
  http.all('*/api/*', () => notFound('Rota de API inexistente.')),
  ...realtimeHandlers,
]
