import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet, useMatches, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { ConnectionBanner } from '@/components/layout/connection-banner'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { MobileTabBar } from '@/components/layout/mobile-nav'
import { NotFoundPage } from '@/features/misc/not-found-page'
import { RouteErrorPage } from '@/features/misc/route-error-page'
import { Toaster } from '@/components/ui/sonner'
import { useSessionCheck } from '@/features/auth/mutations'
import { useIsDesktop } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  errorComponent: RouteErrorPage,
})

/** Ao trocar de página, leva o foco ao conteúdo para quem navega por teclado ou leitor de tela. */
function useFocusOnNavigation() {
  const router = useRouter()
  useEffect(
    () =>
      router.subscribe('onResolved', ({ pathChanged, fromLocation }) => {
        if (pathChanged && fromLocation) {
          document.getElementById('conteudo')?.focus({ preventScroll: true })
        }
      }),
    [router],
  )
}

function RootLayout() {
  useSessionCheck()
  useFocusOnNavigation()
  // cabeçalho e rodapé são do layout desktop; o celular usa a barra inferior
  const isDesktop = useIsDesktop()
  const chrome = useMatches({ select: (matches) => matches.at(-1)?.staticData.chrome })
  const showFooter = useMatches({
    select: (matches) => matches.every((match) => match.staticData.footer !== false),
  })

  return (
    <>
      <a
        href="#conteudo"
        className="bg-primary text-primary-foreground sr-only z-50 px-4 py-2 font-bold focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      <ConnectionBanner />
      {isDesktop && chrome !== 'bare' && <Header />}
      <main
        id="conteudo"
        tabIndex={-1}
        className={cn('min-h-[60vh] outline-none', !chrome && 'max-md:pb-24')}
      >
        <Outlet />
      </main>
      {isDesktop && chrome !== 'bare' && showFooter && <Footer />}
      {!chrome && <MobileTabBar />}
      <Toaster position="top-right" closeButton />
    </>
  )
}
