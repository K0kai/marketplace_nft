import { Link, Outlet } from '@tanstack/react-router'
import {
  BadgePercent,
  Download,
  Heart,
  LogOut,
  MapPin,
  ShoppingCart,
  TriangleAlert,
  User,
} from 'lucide-react'
import { MobileTopBar } from '@/components/layout/mobile-nav'
import { useLogout } from '@/features/auth/mutations'

const itemClass =
  'flex items-center gap-3 border-l-4 border-transparent px-4 py-3 text-sm whitespace-nowrap text-highlight md:max-lg:gap-2 md:max-lg:px-2 md:max-lg:whitespace-normal hover:bg-secondary max-md:border-l-0 max-md:border-b-2 max-md:py-2'
const activeClass = 'border-primary! font-bold bg-secondary md:bg-transparent'

// Ordem do layout. Itens sem "to" estão fora do escopo e deixam isso claro.
const ITEMS = [
  { label: 'Dados do perfil', icon: User, to: '/profile' },
  { label: 'Carteiras', icon: MapPin, to: '/profile/wallets' },
  { label: 'Atividade', icon: ShoppingCart },
  { label: 'Lista de interesse', icon: Heart, to: '/profile/favorites' },
  { label: 'Ofertas', icon: BadgePercent },
  { label: 'Arquivos baixados', icon: Download },
  { label: 'Suporte', icon: TriangleAlert },
] as const

export function AccountLayout() {
  const logout = useLogout()
  return (
    <>
      <MobileTopBar title="Minha conta" />
      <div className="page-container grid gap-6 pt-2 md:grid-cols-[220px_minmax(0,1fr)] md:pt-6 lg:grid-cols-[308px_minmax(0,1fr)] lg:gap-7">
        <aside className="bg-card h-fit min-w-0 md:py-4">
          <p className="px-3 pb-2 text-base font-bold max-md:hidden">Meu perfil</p>
          <nav aria-label="Conta">
            <ul className="flex overflow-x-auto md:flex-col">
              {ITEMS.map((item) => (
                <li key={item.label} className={'to' in item ? undefined : 'max-md:hidden'}>
                  {'to' in item ? (
                    <Link
                      to={item.to}
                      activeOptions={{ exact: true }}
                      activeProps={{ className: activeClass }}
                      className={itemClass}
                    >
                      <item.icon className="size-4" aria-hidden="true" />
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      className={`${itemClass} text-subtle cursor-default hover:bg-transparent`}
                    >
                      <item.icon className="size-4" aria-hidden="true" />
                      {item.label}
                      <span className="border-border ml-auto rounded-full border px-1.5 text-[10px]">
                        em breve
                      </span>
                    </span>
                  )}
                </li>
              ))}
              <li className="md:border-line-strong md:mt-2 md:border-t md:pt-1">
                <button
                  type="button"
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className={`${itemClass} w-full font-bold`}
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  Sair
                </button>
              </li>
            </ul>
          </nav>
        </aside>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </>
  )
}
