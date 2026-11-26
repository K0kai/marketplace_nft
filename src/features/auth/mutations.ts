import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { LoginInput, RegisterInput, Session } from '@/api/contracts'
import { authApi } from '@/api/endpoints'
import { queryKeys } from '@/api/query-keys'
import { endSession, startSession, useSession } from '@/features/session/session-store'

function useAuthMutation<T>(mutationFn: (input: T) => Promise<Session>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: ({ token, user }) => {
      startSession({ token, userId: user.id })
      client.setQueryData(queryKeys.profile(user.id), user)
    },
  })
}

export const useLogin = () => useAuthMutation((input: LoginInput) => authApi.login(input))
export const useRegister = () => useAuthMutation((input: RegisterInput) => authApi.register(input))

export function useLogout() {
  const router = useRouter()
  return useMutation({
    // mesmo sem rede, o logout local precisa acontecer
    mutationFn: () => authApi.logout().catch(() => undefined),
    onSuccess: async () => {
      // sai da área privada antes de encerrar, para o guard não mandar para o login
      await router.navigate({ to: '/' })
      endSession('logout')
      toast.success('Você saiu da conta.')
    },
  })
}

/** Confere no servidor se o token guardado ainda vale (ex.: depois de um refresh). */
export function useSessionCheck() {
  const session = useSession()
  useQuery({
    queryKey: [...queryKeys.user(session?.userId ?? ''), 'session', session?.token],
    queryFn: ({ signal }) => authApi.session({ signal }),
    enabled: Boolean(session),
    staleTime: 60_000,
  })
}
