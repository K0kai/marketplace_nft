import { Link } from '@tanstack/react-router'
import { Heart, LogOut, User, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useProfile } from '@/features/account/queries'
import { useLogout } from '@/features/auth/mutations'

export default function AccountMenu() {
  const profile = useProfile().data
  const logout = useLogout()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-9 max-w-44 px-3"
          aria-label={`${profile?.displayName ?? 'Conta'}, menu da conta`}
        >
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="size-5 rounded-full object-cover" />
          ) : (
            <User aria-hidden="true" />
          )}
          <span className="truncate">{profile?.displayName ?? 'Conta'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card w-56">
        <DropdownMenuLabel className="truncate">{profile?.email ?? 'Sua conta'}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <User aria-hidden="true" /> Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/profile/wallets">
            <Wallet aria-hidden="true" /> Carteiras
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/profile/favorites">
            <Heart aria-hidden="true" /> Lista de interesse
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => logout.mutate()}>
          <LogOut aria-hidden="true" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
