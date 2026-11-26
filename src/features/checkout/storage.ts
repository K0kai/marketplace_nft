import type { CreateOrderInput } from '@/api/contracts'
import { readJson, writeJson } from '@/lib/storage'

// sessionStorage: sobrevive ao refresh, mas some ao fechar a aba
const area = () => sessionStorage
const draftKey = (userId: string) => `kurio.checkout.draft.${userId}`
const attemptKey = (userId: string) => `kurio.checkout.attempt.${userId}`

export type OrderAttempt = { key: string; input: CreateOrderInput }

export const readDraft = <T>(userId: string) => readJson<T>(draftKey(userId), area)
export const writeDraft = (userId: string, draft: unknown) =>
  writeJson(draftKey(userId), draft, area)

export const readAttempt = (userId: string) => readJson<OrderAttempt>(attemptKey(userId), area)
export const clearAttempt = (userId: string) => writeJson(attemptKey(userId), null, area)

/**
 * Mesmo conteúdo reaproveita a mesma chave de idempotência: um reenvio depois de timeout
 * recupera o pedido original em vez de criar outro.
 */
export function prepareAttempt(userId: string, input: CreateOrderInput): OrderAttempt {
  const stored = readAttempt(userId)
  if (stored && JSON.stringify(stored.input) === JSON.stringify(input)) return stored
  const attempt = { key: crypto.randomUUID(), input }
  writeJson(attemptKey(userId), attempt, area)
  return attempt
}

export function clearCheckoutData(userId: string) {
  writeDraft(userId, null)
  clearAttempt(userId)
}
