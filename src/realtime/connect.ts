import type { QueryClient } from '@tanstack/react-query'
import type { Socket } from 'socket.io-client'
import { nftUpdatedEventSchema, orderUpdatedEventSchema } from '@/api/contracts'
import { queryKeys } from '@/api/query-keys'
import type { SessionState } from '@/features/session/session-store'
import { whenNetworkReady } from '@/lib/network-gate'
import { applyNftUpdate, applyOrderUpdate } from './apply-event'
import { EventGate } from './event-gate'
import { connectionStatus } from './notices'

/** Eventos podem se perder enquanto o socket está fora: o REST é quem reconcilia. */
function reconcile(client: QueryClient, userId: string | null) {
  void client.invalidateQueries({ queryKey: queryKeys.nfts })
  void client.invalidateQueries({ queryKey: queryKeys.cart(userId) })
  if (userId) {
    void client.invalidateQueries({ queryKey: queryKeys.orders(userId) })
    void client.invalidateQueries({ queryKey: queryKeys.favorites(userId) })
  }
}

/**
 * Abre um socket para a sessão atual. Cada sessão tem o seu próprio socket e filtro de eventos,
 * então nada da sessão anterior chega à próxima. Retorna a função de limpeza.
 */
export function connectRealtime(client: QueryClient, session: SessionState) {
  const userId = session?.userId ?? null
  const gate = new EventGate()
  let socket: Socket | null = null
  let disposed = false

  const start = async () => {
    await whenNetworkReady()
    // importado depois do MSW: o engine.io guarda o WebSocket global no momento do import
    const { io } = await import('socket.io-client')
    if (disposed) return

    socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
      transports: ['websocket'],
      auth: session ? { token: session.token } : {},
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
    })

    let hasConnected = false
    socket.on('connect', () => {
      connectionStatus.set('online')
      if (hasConnected) reconcile(client, userId)
      // na 1ª conexão basta conferir pedidos: um deles pode ter resolvido antes do socket abrir
      else if (userId) void client.invalidateQueries({ queryKey: queryKeys.orders(userId) })
      hasConnected = true
    })
    socket.on('disconnect', () => connectionStatus.set('reconnecting'))
    socket.on('connect_error', () => connectionStatus.set('reconnecting'))

    socket.on('nft.updated', (raw: unknown) => {
      const event = nftUpdatedEventSchema.safeParse(raw)
      if (disposed || !event.success || !gate.accept(event.data)) return
      applyNftUpdate(client, userId, event.data)
    })

    socket.on('order.updated', (raw: unknown) => {
      const event = orderUpdatedEventSchema.safeParse(raw)
      if (disposed || !event.success) return
      // evento privado de outro usuário é descartado mesmo que chegue até aqui
      if (!userId || event.data.userId !== userId || !gate.accept(event.data)) return
      applyOrderUpdate(client, userId, event.data)
    })
  }

  void start()

  return () => {
    disposed = true
    socket?.removeAllListeners()
    socket?.disconnect()
    gate.reset()
    connectionStatus.set('idle')
  }
}
