import type {
  CreateOrderInput,
  EditionId,
  Order,
  WalletConnection,
} from '../../api/contracts/index.ts'
import { createNftFixtures, type NftRecord } from '../fixtures/nfts.ts'
import { createSeedOrders } from '../fixtures/orders.ts'
import {
  createFavoriteFixtures,
  createUserFixtures,
  createWalletFixtures,
  type UserRecord,
  type WalletRecord,
} from '../fixtures/users.ts'
import type { ScenarioName } from '../scenarios.ts'

export type CartRecord = {
  lines: { nftId: string; editionId: EditionId; quantity: number }[]
  couponCode: string | null
  version: number
}

export type OrderRecord = Order & {
  userId: string
  idempotencyKey: string
  requestHash: string
  // quando o "pagamento" resolve sozinho; null = fica pendente até um comando
  settleAt: number | null
  outcome: 'confirmed' | 'declined'
}

export type MockDb = {
  schemaVersion: number
  scenario: ScenarioName
  nfts: NftRecord[]
  users: UserRecord[]
  sessions: Record<string, { userId: string; expiresAt: number }>
  favorites: Record<string, string[]>
  carts: Record<string, CartRecord>
  wallets: WalletRecord[]
  connections: Record<string, WalletConnection & { userId: string }>
  orders: OrderRecord[]
  eventSequence: number
  // gatilhos de cenário que só devem disparar uma vez (ex.: preço muda no 1º envio)
  fired: string[]
}

export type OrderInput = CreateOrderInput

const SCHEMA_VERSION = 1
export const STORAGE_KEY = 'kurio.mock.db'

export function createSeedDb(scenario: ScenarioName = 'default'): MockDb {
  return {
    schemaVersion: SCHEMA_VERSION,
    scenario,
    nfts: createNftFixtures(),
    users: createUserFixtures(),
    sessions: {},
    favorites: createFavoriteFixtures(),
    carts: {},
    wallets: createWalletFixtures(),
    connections: {},
    orders: createSeedOrders(),
    eventSequence: 0,
    fired: [],
  }
}

// Em testes unitários (Node) não existe localStorage, então o estado fica só em memória.
const storage: Storage | null = typeof localStorage === 'undefined' ? null : localStorage

function load(): MockDb {
  const raw = storage?.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as MockDb
      if (parsed.schemaVersion === SCHEMA_VERSION) return parsed
    } catch {
      // estado corrompido: volta ao cenário conhecido
    }
  }
  return createSeedDb()
}

let current: MockDb | null = null

export function getDb(): MockDb {
  current ??= load()
  return current
}

export function invalidateDbCache(): void {
  current = null
}

export function saveDb(): void {
  if (current) storage?.setItem(STORAGE_KEY, JSON.stringify(current))
}

export function resetDb(scenario: ScenarioName = 'default'): MockDb {
  current = createSeedDb(scenario)
  saveDb()
  return current
}
