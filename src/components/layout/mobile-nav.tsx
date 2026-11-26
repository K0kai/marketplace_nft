import { Link, useCanGoBack, useRouter, useRouterState } from '@tanstack/react-router'
import { ChevronLeft, Heart, Home, ScanLine, ShoppingCart, User } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCart } from '@/features/cart/queries'
import { cn } from '@/lib/utils'
import { SearchDialog } from './search-dialog'

const itemClass = 'relative flex size-12 items-center justify-center text-muted-foreground'

export function MobileTabBar() {
  const path = useRouterState({ select: (state) => state.location.pathname })
  const count = useCart().data?.itemCount ?? 0
  const current = (active: boolean) => (active ? 'page' : undefined)
  const active = (isActive: boolean) => cn(itemClass, isActive && 'text-highlight')
  const isProfile = path === '/profile' || path.startsWith('/profile/wallets')

  return (
    <nav
      aria-label="Navegação inferior"
      className="bg-card fixed inset-x-0 bottom-0 z-40 rounded-t-[28px] px-5 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <ul className="flex items-center justify-between">
        <li>
          <Link
            to="/"
            className={active(path === '/')}
            aria-current={current(path === '/')}
            aria-label="Início"
          >
            <Home className="size-6 fill-current" aria-hidden="true" />
          </Link>
        </li>
        <li>
          <Link
            to="/profile/favorites"
            className={active(path === '/profile/favorites')}
            aria-label="Lista de interesse"
          >
            <Heart className="size-6 fill-current" aria-hidden="true" />
          </Link>
        </li>
        <li className="-mt-9">
          <SearchDialog
            trigger={
              <button
                type="button"
                aria-label="Buscar NFTs"
                className="gradient-pill border-background flex size-16 items-center justify-center rounded-full border-4"
              >
                <ScanLine className="size-7" aria-hidden="true" />
              </button>
            }
          />
        </li>
        <li>
          <Link
            to="/cart"
            className={active(path === '/cart')}
            aria-label={`Carrinho, ${count} itens`}
          >
            <ShoppingCart className="size-6 fill-current" aria-hidden="true" />
            {count > 0 && (
              <span
                aria-hidden="true"
                className="bg-primary text-primary-foreground absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
              >
                {count}
              </span>
            )}
          </Link>
        </li>
        <li>
          <Link to="/profile" className={active(isProfile)} aria-label="Meu perfil">
            <User className="size-6 fill-current" aria-hidden="true" />
          </Link>
        </li>
      </ul>
    </nav>
  )
}

export function BackButton({ className }: { className?: string }) {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  return (
    <button
      type="button"
      aria-label="Voltar"
      onClick={() => (canGoBack ? router.history.back() : void router.navigate({ to: '/' }))}
      className={cn(
        'bg-secondary text-subtle flex size-10 shrink-0 items-center justify-center rounded-full',
        className,
      )}
    >
      <ChevronLeft className="size-5" aria-hidden="true" />
    </button>
  )
}

/** Cabeçalho das telas internas no celular: voltar + título centralizado. */
export function MobileTopBar({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-6 pt-5 pb-4 md:hidden">
      <BackButton />
      <p aria-hidden="true" className="flex-1 text-center text-lg font-bold">
        {title}
      </p>
      <div className="flex w-10 justify-end">{action}</div>
    </div>
  )
}
