import { QueryClient } from '@tanstack/react-query'
import { toApiError } from '@/api/errors'

const MAX_RETRIES = 2

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      // 4xx não adianta repetir; timeout também não, para não deixar a tela presa por muito tempo
      retry: (failures, error) => {
        const apiError = toApiError(error)
        return apiError.isTransient && apiError.code !== 'TIMEOUT' && failures < MAX_RETRIES
      },
      retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4000),
    },
    // mutations nunca repetem sozinhas: quem decide reenviar é o usuário
    mutations: { retry: false },
  },
})
