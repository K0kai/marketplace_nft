import { redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { sessionStore } from '@/features/session/session-store'
import { safeRedirect } from './redirect'

export const authSearchSchema = z.object({ redirect: z.string().optional().catch(undefined) })

/** Quem já está autenticado não vê login/cadastro. */
export function redirectIfAuthenticated(target: string | undefined) {
  if (sessionStore.get()) throw redirect({ href: safeRedirect(target), replace: true })
}
