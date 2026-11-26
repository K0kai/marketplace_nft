import { toast } from 'sonner'
import { queryKeys } from '@/api/query-keys'
import { clearCheckoutData } from '@/features/checkout/storage'
import { getSessionEndReason, sessionStore } from '@/features/session/session-store'
import { clearCartNotices } from '@/realtime/notices'
import { connectRealtime } from '@/realtime/connect'
import { queryClient } from './query-client'
import { router } from './router'

/**
 * Tudo o que precisa acontecer quando a sessão muda fica aqui, fora do React:
 * limpar cache privado, trocar o socket e reavaliar as rotas protegidas.
 */
export function startSessionLifecycle() {
  let previous = sessionStore.get()
  let disconnect = connectRealtime(queryClient, previous)

  sessionStore.subscribe(() => {
    const next = sessionStore.get()
    if (next?.token === previous?.token) return

    disconnect()
    clearCartNotices()

    if (previous && previous.userId !== next?.userId) {
      const root = queryKeys.user(previous.userId)
      void queryClient.cancelQueries({ queryKey: root })
      queryClient.removeQueries({ queryKey: root })
      queryClient.getMutationCache().clear()
    }
    queryClient.removeQueries({ queryKey: ['guest'] })

    if (previous && !next) {
      if (getSessionEndReason() === 'expired') {
        // o rascunho do checkout é mantido para o usuário retomar depois de entrar
        toast.warning('Sua sessão expirou. Entre novamente para continuar.', { id: 'session' })
      } else {
        clearCheckoutData(previous.userId)
      }
      // faz os guards rodarem de novo: telas privadas redirecionam para o login
      void router.invalidate()
    }

    previous = next
    disconnect = connectRealtime(queryClient, next)
  })
}
