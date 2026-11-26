import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { sessionStore } from '@/features/session/session-store'

// Layout sem caminho: tudo dentro dele exige sessão.
export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ location }) => {
    if (!sessionStore.get()) {
      throw redirect({ to: '/login', search: { redirect: location.href }, replace: true })
    }
  },
  component: Outlet,
})
