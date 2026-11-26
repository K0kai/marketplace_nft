import { HttpResponse } from 'msw'
import type { z } from 'zod'
import type { ErrorCode } from '../api/contracts/index.ts'
import { getDb, saveDb } from './db/store.ts'

export function apiError(
  status: number,
  code: ErrorCode,
  message: string,
  extra: { fieldErrors?: Record<string, string>; details?: unknown } = {},
) {
  return HttpResponse.json({ error: { code, message, ...extra } }, { status })
}

export const notFound = (message = 'Recurso não encontrado') => apiError(404, 'NOT_FOUND', message)

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form'
    fields[key] ??= issue.message
  }
  return fields
}

/** Valida o corpo com o schema do contrato; se falhar, interrompe com 422. */
export async function readBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.output<T>> {
  const raw: unknown = await request.json().catch(() => null)
  const result = schema.safeParse(raw)
  if (!result.success) {
    // o MSW trata um Response lançado como a resposta do handler
    throw apiError(422, 'VALIDATION_ERROR', 'Revise os campos destacados', {
      fieldErrors: zodFieldErrors(result.error),
    })
  }
  return result.data
}

function bearer(request: Request): string | null {
  const header = request.headers.get('authorization')
  return header?.startsWith('Bearer ') ? header.slice(7) : null
}

/** Devolve a sessão válida, null para visitante, ou lança 401 se o token não vale mais. */
export function optionalAuth(request: Request) {
  const token = bearer(request)
  if (!token) return null
  const db = getDb()
  const session = db.sessions[token]
  if (!session || session.expiresAt <= Date.now()) {
    if (session) {
      delete db.sessions[token]
      saveDb()
    }
    throw apiError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.')
  }
  return { token, userId: session.userId, expiresAt: session.expiresAt }
}

export function requireAuth(request: Request) {
  const auth = optionalAuth(request)
  if (!auth) throw apiError(401, 'UNAUTHENTICATED', 'Entre para continuar.')
  return auth
}

/** Dono do carrinho: usuário autenticado ou visitante identificado pelo X-Guest-Id. */
export function cartOwner(request: Request): string {
  const auth = optionalAuth(request)
  if (auth) return `user:${auth.userId}`
  const guest = request.headers.get('x-guest-id')
  if (!guest) throw apiError(422, 'VALIDATION_ERROR', 'Identificador de visitante ausente')
  return `guest:${guest}`
}

export const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`

/** Hash estável e curto (FNV-1a) para identificar conteúdo de cotações e pedidos. */
export function contentHash(value: unknown): string {
  const text = JSON.stringify(value)
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}
