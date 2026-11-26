import { Link, useRouterState } from '@tanstack/react-router'
import { LogIn, Search, ShoppingCart } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/features/cart/queries'
import { useSession } from '@/features/session/session-store'
import { cn } from '@/lib/utils'
import { SearchDialog } from './search-dialog'

const MARKET_PATHS = ['/nft', '/cart', '/checkout', '/orders']

function useActiveSection() {
  const path = useRouterState({ select: (state) => state.location.pathname })
  if (MARKET_PATHS.some((prefix) => path.startsWith(prefix))) return 'market'
  return path.startsWith('/em-breve') ? null : 'home'
}

const navClass = (active: boolean) =>
  cn(
    'inline-block border-b-2 border-transparent pb-5 text-sm hover:text-highlight',
    active && 'border-primary font-bold text-highlight',
  )

export function CartBadge({ className }: { className?: string }) {
  const count = useCart().data?.itemCount ?? 0
  return (
    <Link
      to="/cart"
      aria-label={`Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`}
      className={cn(
        'hover:text-highlight relative flex size-10 items-center justify-center',
        className,
      )}
    >
      <ShoppingCart className="size-5" aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          data-testid="cart-count"
          className="bg-primary text-primary-foreground absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
        >
          {count}
        </span>
      )}
    </Link>
  )
}

// o menu (e o posicionamento dele) só é baixado para quem está logado no desktop
const AccountMenu = lazy(() => import('./account-menu'))

function UserMenu() {
  const session = useSession()
  const location = useRouterState({ select: (state) => state.location.href })

  if (!session) {
    return (
      <Button asChild className="h-9 px-3">
        <Link
          to="/login"
          search={{ redirect: location.startsWith('/login') ? undefined : location }}
        >
          <LogIn aria-hidden="true" />
          Entrar
        </Link>
      </Button>
    )
  }

  return (
    <Suspense fallback={<span className="h-9 w-32" aria-hidden="true" />}>
      <AccountMenu />
    </Suspense>
  )
}

export function Header() {
  const active = useActiveSection()
  return (
    <header className="page-container max-md:hidden">
      <div className="border-line-strong/60 flex h-[68px] items-center justify-between gap-4 border-b">
        <Link to="/" className="text-sm font-bold tracking-[0.18em]">
          KURIO
        </Link>
        <nav aria-label="Principal" className="self-end">
          <ul className="flex gap-6 lg:gap-10">
            <li>
              <Link to="/" className={navClass(active === 'home')} activeOptions={{ exact: true }}>
                Início
              </Link>
            </li>
            <li>
              <Link
                to="/"
                hash="catalogo"
                className={navClass(active === 'market')}
                activeProps={{}}
              >
                Mercado
              </Link>
            </li>
            <li>
              <Link to="/em-breve" search={{ area: 'Criadores' }} className={navClass(false)}>
                Criadores
              </Link>
            </li>
            <li>
              <Link to="/em-breve" search={{ area: 'Aprenda' }} className={navClass(false)}>
                Aprenda
              </Link>
            </li>
          </ul>
        </nav>
        <div className="flex items-center gap-2 lg:gap-4">
          <SearchDialog
            trigger={
              <button
                type="button"
                aria-label="Buscar NFTs"
                className="hover:text-highlight flex size-10 items-center justify-center"
              >
                <Search className="size-5" aria-hidden="true" />
              </button>
            }
          />
          <CartBadge />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
