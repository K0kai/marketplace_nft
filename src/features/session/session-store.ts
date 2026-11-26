import { readJson, writeJson } from '@/lib/storage'
import { createStore } from '@/lib/store'

export type SessionState = { token: string; userId: string } | null

const KEY = 'kurio.session'
const GUEST_KEY = 'kurio.guest'

export const sessionStore = createStore<SessionState>(readJson<SessionState>(KEY))

export type SessionEndReason = 'logout' | 'expired'
let lastEndReason: SessionEndReason | null = null

export function startSession(session: NonNullable<SessionState>) {
  lastEndReason = null
  writeJson(KEY, session)
  sessionStore.set(session)
}

export function endSession(reason: SessionEndReason) {
  if (!sessionStore.get()) return
  lastEndReason = reason
  writeJson(KEY, null)
  sessionStore.set(null)
}

export const getSessionEndReason = () => lastEndReason

export function getGuestId(): string {
  let id = readJson<string>(GUEST_KEY)
  if (!id) {
    id = crypto.randomUUID()
    writeJson(GUEST_KEY, id)
  }
  return id
}

// logout ou login feito em outra aba reflete aqui
window.addEventListener('storage', (event) => {
  if (event.key === KEY) sessionStore.set(readJson<SessionState>(KEY))
})

export const useSession = () => sessionStore.use()
