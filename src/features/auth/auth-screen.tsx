import { Link, useRouter } from '@tanstack/react-router'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { HomePage } from '@/features/catalog/home-page'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useIsDesktop } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { LoginForm } from './login-form'
import { safeRedirect } from './redirect'
import { RegisterForm } from './register-form'
import { SocialButtons } from './social-buttons'

type Mode = 'login' | 'register'

const COPY = {
  login: {
    title: 'Entrar',
    description: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
  },
  register: {
    title: 'Criar conta',
    description: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
  },
}

function Tab({
  to,
  active,
  redirect,
  label,
}: {
  to: '/login' | '/register'
  active: boolean
  redirect?: string
  label: string
}) {
  return (
    <Link
      to={to}
      search={{ redirect }}
      replace
      aria-current={active ? 'page' : undefined}
      className={cn('hover:text-highlight px-2 text-lg', active && 'text-highlight font-bold')}
    >
      {label}
    </Link>
  )
}

function useAfterAuth(redirect?: string) {
  const router = useRouter()
  // volta exatamente para onde o usuário estava (ex.: checkout)
  return () => router.history.replace(safeRedirect(redirect))
}

function AuthBody({ mode, redirect }: { mode: Mode; redirect?: string }) {
  const done = useAfterAuth(redirect)
  return (
    <div className="flex flex-col gap-5">
      {mode === 'login' ? <LoginForm onSuccess={done} /> : <RegisterForm onSuccess={done} />}
      <SocialButtons />
    </div>
  )
}

/** Desktop: modal sobre a home. Celular: tela cheia. Mesma rota nos dois. */
export function AuthScreen({ mode, redirect }: { mode: Mode; redirect?: string }) {
  const isDesktop = useIsDesktop()
  const router = useRouter()
  const copy = COPY[mode]
  useDocumentTitle(copy.title)

  if (isDesktop) {
    return (
      <>
        <HomePage search={{}} />
        <Dialog open onOpenChange={(open) => !open && void router.navigate({ to: '/' })}>
          <DialogContent className="bg-card border-b-primary max-h-[92dvh] gap-5 overflow-y-auto border-0 border-b-[6px] px-10 py-8 sm:max-w-[420px]">
            <nav aria-label="Acesso" className="divide-primary flex justify-center divide-x">
              <Tab to="/login" label="Entrar" active={mode === 'login'} redirect={redirect} />
              <Tab
                to="/register"
                label="Criar conta"
                active={mode === 'register'}
                redirect={redirect}
              />
            </nav>
            <DialogTitle className="sr-only">{copy.title}</DialogTitle>
            <DialogDescription className="text-foreground text-center text-xs">
              {copy.description}
            </DialogDescription>
            <AuthBody mode={mode} redirect={redirect} />
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-10 px-7 pt-20 pb-10">
      <Link to="/" className="self-center text-3xl font-bold tracking-[0.12em]">
        KURIO
      </Link>
      <h1 className="text-center text-xl font-bold">
        {mode === 'login' ? 'Entrar' : 'Criar perfil de colecionador'}
      </h1>
      <AuthBody mode={mode} redirect={redirect} />
      <p className="text-muted-foreground text-center text-sm">
        {mode === 'login' ? 'Novo na Kurio? ' : 'Já tem uma conta? '}
        <Link
          to={mode === 'login' ? '/register' : '/login'}
          search={{ redirect }}
          replace
          className="underline-offset-4 hover:underline"
        >
          {mode === 'login' ? 'Crie uma conta' : 'Entre'}
        </Link>
      </p>
    </div>
  )
}
