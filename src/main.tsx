import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { queryClient } from './app/query-client'
import { router } from './app/router'
import { startSessionLifecycle } from './app/session-lifecycle'
import { setNetworkReady } from './lib/network-gate'
import './index.css'

if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
  // carregado à parte: a interface pinta antes, e as requisições esperam o worker
  setNetworkReady(import('./mocks/browser').then((mocks) => mocks.startMockServer()))
}

startSessionLifecycle()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
