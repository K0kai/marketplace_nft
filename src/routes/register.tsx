import { createFileRoute } from '@tanstack/react-router'
import { authSearchSchema, redirectIfAuthenticated } from '@/features/auth/auth-route'
import { AuthScreen } from '@/features/auth/auth-screen'

export const Route = createFileRoute('/register')({
  validateSearch: authSearchSchema,
  beforeLoad: ({ search }) => redirectIfAuthenticated(search.redirect),
  staticData: { chrome: 'mobile-immersive' },
  component: function RegisterRoute() {
    return <AuthScreen mode="register" redirect={Route.useSearch().redirect} />
  },
})
