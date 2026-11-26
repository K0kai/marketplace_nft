import { http, HttpResponse } from 'msw'
import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  avatarInputSchema,
  passwordInputSchema,
  profileInputSchema,
  walletConnectionInputSchema,
  walletInputSchema,
  type Wallet,
  type WalletInput,
} from '../../api/contracts/index.ts'
import { hashPassword, randomSalt } from '../db/password.ts'
import { getDb, saveDb } from '../db/store.ts'
import type { WalletRecord } from '../fixtures/users.ts'
import { apiError, newId, notFound, readBody, requireAuth } from '../http.ts'
import { toProfile } from './session.ts'

function currentUser(request: Request) {
  const { userId } = requireAuth(request)
  const user = getDb().users.find((u) => u.id === userId)
  if (!user) throw apiError(401, 'SESSION_EXPIRED', 'Sessão inválida.')
  return user
}

const toWallet = ({ userId: _, ...wallet }: WalletRecord): Wallet => wallet

function assertWalletRules(userId: string, input: WalletInput, ignoreId?: string) {
  const others = getDb().wallets.filter((w) => w.userId === userId && w.id !== ignoreId)
  if (others.some((w) => w.slot === input.slot)) {
    const label = input.slot === 'primary' ? 'principal' : 'secundária'
    throw apiError(409, 'CONFLICT', `Você já tem uma carteira ${label}.`)
  }
  // endereços iguais só são aceitos quando a secundária copia a principal
  const duplicated = others.find(
    (w) => w.address.toLowerCase() === input.address.toLowerCase() && w.network === input.network,
  )
  if (duplicated && input.nickname.toLowerCase() === duplicated.nickname.toLowerCase()) {
    throw apiError(409, 'CONFLICT', 'Revise os campos destacados', {
      fieldErrors: { nickname: 'Já existe uma carteira com este apelido e endereço.' },
    })
  }
}

export const accountHandlers = [
  http.get('*/api/profile', ({ request }) => HttpResponse.json(toProfile(currentUser(request)))),

  http.patch('*/api/profile', async ({ request }) => {
    const user = currentUser(request)
    const input = await readBody(request, profileInputSchema)
    const others = getDb().users.filter((u) => u.id !== user.id)
    const fieldErrors: Record<string, string> = {}
    if (others.some((u) => u.email === input.email.toLowerCase())) {
      fieldErrors.email = 'Este e-mail já está em uso.'
    }
    if (others.some((u) => u.username.toLowerCase() === input.username.toLowerCase())) {
      fieldErrors.username = 'Este nome de usuário já está em uso.'
    }
    if (Object.keys(fieldErrors).length > 0) {
      return apiError(409, 'CONFLICT', 'Revise os campos destacados', { fieldErrors })
    }
    Object.assign(user, input, { email: input.email.toLowerCase() })
    saveDb()
    return HttpResponse.json(toProfile(user))
  }),

  http.put('*/api/profile/avatar', async ({ request }) => {
    const user = currentUser(request)
    const { dataUrl } = await readBody(request, avatarInputSchema)
    const [header = '', content = ''] = dataUrl.split(',')
    const type = header.match(/^data:(.+);base64$/)?.[1]
    if (!type || !AVATAR_TYPES.some((allowed) => allowed === type)) {
      return apiError(422, 'VALIDATION_ERROR', 'Envie uma imagem PNG, JPG ou WebP.', {
        fieldErrors: { avatar: 'Envie uma imagem PNG, JPG ou WebP.' },
      })
    }
    if ((content.length * 3) / 4 > AVATAR_MAX_BYTES) {
      return apiError(422, 'VALIDATION_ERROR', 'A imagem passa de 512 KB.', {
        fieldErrors: { avatar: 'A imagem passa de 512 KB.' },
      })
    }
    user.avatarUrl = dataUrl
    saveDb()
    return HttpResponse.json(toProfile(user))
  }),

  http.delete('*/api/profile/avatar', ({ request }) => {
    const user = currentUser(request)
    user.avatarUrl = null
    saveDb()
    return HttpResponse.json(toProfile(user))
  }),

  http.put('*/api/profile/password', async ({ request }) => {
    const user = currentUser(request)
    const input = await readBody(request, passwordInputSchema)
    const current = await hashPassword(input.currentPassword, user.passwordSalt)
    if (current !== user.passwordHash) {
      return apiError(422, 'VALIDATION_ERROR', 'Revise os campos destacados', {
        fieldErrors: { currentPassword: 'Senha atual incorreta.' },
      })
    }
    user.passwordSalt = randomSalt()
    user.passwordHash = await hashPassword(input.newPassword, user.passwordSalt)
    saveDb()
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('*/api/wallets', ({ request }) => {
    const { userId } = requireAuth(request)
    const items = getDb()
      .wallets.filter((w) => w.userId === userId)
      .sort((a, b) => a.slot.localeCompare(b.slot))
      .map(toWallet)
    return HttpResponse.json({ items })
  }),

  http.post('*/api/wallets', async ({ request }) => {
    const { userId } = requireAuth(request)
    const input = await readBody(request, walletInputSchema)
    assertWalletRules(userId, input)
    const wallet: WalletRecord = { ...input, id: newId('wallet'), userId }
    getDb().wallets.push(wallet)
    saveDb()
    return HttpResponse.json(toWallet(wallet), { status: 201 })
  }),

  http.put('*/api/wallets/:id', async ({ request, params }) => {
    const { userId } = requireAuth(request)
    const input = await readBody(request, walletInputSchema)
    const wallet = getDb().wallets.find((w) => w.id === params.id)
    if (!wallet) return notFound('Carteira não encontrada.')
    if (wallet.userId !== userId) {
      return apiError(403, 'FORBIDDEN', 'Esta carteira pertence a outra conta.')
    }
    assertWalletRules(userId, input, wallet.id)
    Object.assign(wallet, input)
    saveDb()
    return HttpResponse.json(toWallet(wallet))
  }),

  http.post('*/api/wallet-connections', async ({ request }) => {
    const { userId } = requireAuth(request)
    const input = await readBody(request, walletConnectionInputSchema)
    const db = getDb()
    const wallet = db.wallets.find((w) => w.id === input.walletId && w.userId === userId)
    if (!wallet) return notFound('Carteira não encontrada.')
    if (db.scenario === 'wallet-rejected') {
      return apiError(409, 'WALLET_REJECTED', 'A conexão foi recusada na carteira.')
    }
    const connection = { ...input, id: newId('conn'), status: 'connected' as const }
    db.connections[connection.id] = { ...connection, userId }
    saveDb()
    return HttpResponse.json(connection, { status: 201 })
  }),

  http.delete('*/api/wallet-connections/:id', ({ request, params }) => {
    const { userId } = requireAuth(request)
    const db = getDb()
    const id = String(params.id)
    if (db.connections[id]?.userId === userId) delete db.connections[id]
    saveDb()
    return new HttpResponse(null, { status: 204 })
  }),
]
