import { http, HttpResponse } from 'msw'
import { loginInputSchema, registerInputSchema, type Profile } from '../../api/contracts/index.ts'
import { hashPassword, randomSalt } from '../db/password.ts'
import { getDb, saveDb } from '../db/store.ts'
import type { UserRecord } from '../fixtures/users.ts'
import { mergeGuestCart } from '../domain/cart.ts'
import { apiError, newId, readBody, requireAuth } from '../http.ts'
import { SESSION_TTL_MS, SHORT_SESSION_TTL_MS } from '../scenarios.ts'

/** Nunca devolve hash ou salt para o cliente. */
export function toProfile(user: UserRecord): Profile {
  const { id, displayName, username, email, ensName, ensSuffix, walletNickname, avatarUrl } = user
  return { id, displayName, username, email, ensName, ensSuffix, walletNickname, avatarUrl }
}

function startSession(user: UserRecord, guestId: string | null) {
  const db = getDb()
  const token = newId('tok')
  const ttl = db.scenario === 'short-session' ? SHORT_SESSION_TTL_MS : SESSION_TTL_MS
  const expiresAt = Date.now() + ttl
  db.sessions[token] = { userId: user.id, expiresAt }
  mergeGuestCart(guestId, user.id)
  saveDb()
  return { token, expiresAt: new Date(expiresAt).toISOString(), user: toProfile(user) }
}

export const sessionHandlers = [
  http.post('*/api/auth/register', async ({ request }) => {
    const input = await readBody(request, registerInputSchema)
    const db = getDb()
    const email = input.email.toLowerCase()

    const fieldErrors: Record<string, string> = {}
    if (db.scenario === 'register-conflict' || db.users.some((u) => u.email === email)) {
      fieldErrors.email = 'Este e-mail já está cadastrado.'
    }
    if (db.users.some((u) => u.username.toLowerCase() === input.username.toLowerCase())) {
      fieldErrors.username = 'Este nome de usuário já está em uso.'
    }
    if (Object.keys(fieldErrors).length > 0) {
      return apiError(409, 'CONFLICT', 'Não foi possível criar a conta.', { fieldErrors })
    }
    // regra que só o servidor conhece: mostra erro de validação vindo da API
    if (['admin', 'kurio', 'suporte'].includes(input.username.toLowerCase())) {
      return apiError(422, 'VALIDATION_ERROR', 'Revise os campos destacados', {
        fieldErrors: { username: 'Este nome de usuário é reservado.' },
      })
    }

    const salt = randomSalt()
    const user: UserRecord = {
      id: newId('user'),
      displayName: input.username,
      username: input.username,
      email,
      ensName: input.username.toLowerCase().replace(/[^a-z0-9-.]/g, ''),
      ensSuffix: '.eth',
      walletNickname: 'Principal',
      avatarUrl: null,
      passwordSalt: salt,
      passwordHash: await hashPassword(input.password, salt),
    }
    db.users.push(user)
    return HttpResponse.json(startSession(user, request.headers.get('x-guest-id')), {
      status: 201,
    })
  }),

  http.post('*/api/auth/login', async ({ request }) => {
    const input = await readBody(request, loginInputSchema)
    const user = getDb().users.find((u) => u.email === input.email.toLowerCase())
    const valid =
      user && (await hashPassword(input.password, user.passwordSalt)) === user.passwordHash
    if (!user || !valid) {
      // mensagem genérica: não revela se o e-mail existe
      return apiError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
    }
    return HttpResponse.json(startSession(user, request.headers.get('x-guest-id')))
  }),

  http.get('*/api/auth/session', ({ request }) => {
    const { token, userId, expiresAt } = requireAuth(request)
    const user = getDb().users.find((u) => u.id === userId)
    if (!user) return apiError(401, 'SESSION_EXPIRED', 'Sessão inválida.')
    return HttpResponse.json({
      token,
      expiresAt: new Date(expiresAt).toISOString(),
      user: toProfile(user),
    })
  }),

  http.post('*/api/auth/logout', ({ request }) => {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (token) {
      delete getDb().sessions[token]
      saveDb()
    }
    return new HttpResponse(null, { status: 204 })
  }),
]
