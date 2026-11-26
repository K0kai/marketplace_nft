import type { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { routeTree } from '@/routeTree.gen'
import { queryClient } from './query-client'

// URLs limpas (?q=ape&page=2) em vez da codificação JSON padrão do router
function parseSearch(search: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(search))
}

function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  const text = params.toString()
  return text ? `?${text}` : ''
}

export const router = createRouter({
  routeTree,
  context: { queryClient } satisfies { queryClient: QueryClient },
  parseSearch,
  stringifySearch,
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
  interface StaticDataRouteOption {
    // 'mobile-immersive' esconde a tab bar no celular; 'bare' esconde todo o entorno
    chrome?: 'mobile-immersive' | 'bare'
    /** false nas telas cujo frame não tem rodapé */
    footer?: boolean
  }
}
