import { useSyncExternalStore } from 'react'

/** Store mínimo para os poucos estados que são do cliente (sessão, avisos, conexão). */
export function createStore<T>(initial: T) {
  let state = initial
  const listeners = new Set<() => void>()
  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => void listeners.delete(listener)
  }
  const get = () => state
  return {
    get,
    subscribe,
    set(next: T) {
      if (Object.is(next, state)) return
      state = next
      listeners.forEach((listener) => listener())
    },
    use: () => useSyncExternalStore(subscribe, get, get),
  }
}
