import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import type { RealtimeEvent } from '../api/contracts/index.ts'
import { getDb, saveDb } from './db/store.ts'

// Intercepta o WebSocket do socket.io-client (o long-polling não passa pelo MSW).
// Antes de comparar, o MSW tira o prefixo /socket.io/ e a query: sobra só a raiz do host.
const socketLink = ws.link(/^wss?:\/\/[^/]+\/$/)

const PING_INTERVAL_MS = 20_000
const HISTORY_LIMIT = 50

type MockClient = {
  token: string | null
  emit: (event: RealtimeEvent) => void
  close: () => void
}

const clients = new Set<MockClient>()
const history: RealtimeEvent[] = []
let offline = false

function readAuthToken(packet: string): string | null {
  try {
    const auth = JSON.parse(packet.slice(2) || '{}') as { token?: unknown }
    return typeof auth.token === 'string' ? auth.token : null
  } catch {
    return null
  }
}

function userIdOf(token: string | null): string | null {
  if (!token) return null
  const session = getDb().sessions[token]
  return session && session.expiresAt > Date.now() ? session.userId : null
}

export const realtimeHandlers = [
  socketLink.addEventListener('connection', (connection) => {
    // o que não é Socket.IO (ex.: o HMR do Vite) segue para o servidor de verdade
    if (!connection.client.url.searchParams.has('EIO')) {
      connection.server.connect()
      return
    }
    if (offline) {
      setTimeout(() => connection.client.close(), 0)
      return
    }

    const io = toSocketIo(connection)
    const client: MockClient = {
      token: null,
      emit: (event) => io.client.emit(event.type, event),
      close: () => connection.client.close(),
    }

    connection.client.addEventListener('message', (message) => {
      // "40" é o pacote CONNECT do Socket.IO; o auth do cliente vem junto
      if (typeof message.data === 'string' && message.data.startsWith('40')) {
        client.token = readAuthToken(message.data)
      }
    })

    // o binding não envia o ping do Engine.IO; sem ele o cliente cai por "ping timeout"
    const ping = setInterval(() => connection.client.send('2'), PING_INTERVAL_MS)
    connection.client.addEventListener('close', () => {
      clearInterval(ping)
      clients.delete(client)
    })

    clients.add(client)
  }),
]

/** Entrega um evento exatamente como ele é (usado também para duplicatas e eventos antigos). */
export function deliver(event: RealtimeEvent): void {
  for (const client of clients) {
    if (event.userId && userIdOf(client.token) !== event.userId) continue
    client.emit(event)
  }
}

export function publish(event: Omit<RealtimeEvent, 'eventId' | 'occurredAt'>): RealtimeEvent {
  const db = getDb()
  db.eventSequence += 1
  saveDb()
  const complete = {
    ...event,
    eventId: `evt-${db.eventSequence}`,
    occurredAt: new Date().toISOString(),
  } as RealtimeEvent
  history.push(complete)
  if (history.length > HISTORY_LIMIT) history.shift()
  deliver(complete)
  return complete
}

export const socketControl = {
  history: () => [...history],
  clearHistory: () => history.splice(0),
  connectedCount: () => clients.size,
  disconnectAll() {
    for (const client of clients) client.close()
    clients.clear()
  },
  setOffline(value: boolean) {
    offline = value
    if (value) this.disconnectAll()
  },
}
