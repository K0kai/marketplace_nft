import { Link } from '@tanstack/react-router'
import { CheckCircle2, PlugZap, Wallet as WalletIcon } from 'lucide-react'
import { RadioGroup } from 'radix-ui'
import {
  NETWORK_LABELS,
  PROVIDER_LABELS,
  walletProviderSchema,
  type Wallet,
  type WalletProvider,
} from '@/api/contracts'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const dot = (
  <span className="border-primary flex size-4 shrink-0 items-center justify-center rounded-full border">
    <RadioGroup.Indicator className="bg-primary block size-2 rounded-full" />
  </span>
)

export const shortAddress = (address: string) =>
  address.startsWith('0x') && address.length > 12
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : address

export function RegisteredWallets({
  wallets,
  value,
  onChange,
}: {
  wallets: Wallet[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <section aria-labelledby="wallets-title" className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="wallets-title" className="text-sm font-bold">
          Carteira cadastrada
        </h2>
        <Link to="/profile/wallets" className="text-highlight text-xs font-bold">
          Trocar carteira
        </Link>
      </div>
      <RadioGroup.Root
        aria-labelledby="wallets-title"
        value={value}
        onValueChange={onChange}
        className="grid gap-3 md:grid-cols-2"
      >
        {wallets.map((wallet) => (
          <RadioGroup.Item
            key={wallet.id}
            value={wallet.id}
            className="bg-card data-[state=checked]:border-primary flex items-center gap-4 rounded-[14px] border border-transparent p-4 text-left md:rounded-[4px]"
          >
            {dot}
            <span className="min-w-0">
              <span className="block text-sm font-bold">{wallet.nickname}</span>
              <span className="text-muted-foreground block truncate text-xs">
                {wallet.secondaryAddress || shortAddress(wallet.address)}
              </span>
              <span className="text-muted-foreground block text-xs">
                Rede {NETWORK_LABELS[wallet.network]}
              </span>
            </span>
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </section>
  )
}

export function ProviderOptions({
  value,
  onChange,
}: {
  value: WalletProvider
  onChange: (provider: WalletProvider) => void
}) {
  return (
    <RadioGroup.Root
      aria-label="Provedor da carteira"
      value={value}
      onValueChange={(next) => onChange(next as WalletProvider)}
      className="flex flex-col gap-3"
    >
      {walletProviderSchema.options.map((provider) => (
        <RadioGroup.Item
          key={provider}
          value={provider}
          className="bg-card md:border-border data-[state=checked]:md:border-primary flex items-center gap-3 rounded-[14px] p-4 text-sm md:rounded-[4px] md:border md:bg-transparent md:p-3"
        >
          <span
            aria-hidden="true"
            className="bg-secondary text-highlight flex size-10 items-center justify-center rounded-full font-bold md:hidden"
          >
            {provider === 'coinbase' ? (
              <WalletIcon className="size-4" />
            ) : (
              PROVIDER_LABELS[provider][0]
            )}
          </span>
          <span className="flex-1 text-left md:order-2">{PROVIDER_LABELS[provider]}</span>
          <span className="md:order-1">{dot}</span>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  )
}

export function ConnectionStatusBox({
  connected,
  connecting,
  error,
  onConnect,
  onDisconnect,
  buttonRef,
}: {
  connected: boolean
  connecting: boolean
  error: string | null
  onConnect: () => void
  onDisconnect: () => void
  buttonRef: React.Ref<HTMLButtonElement>
}) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-3">
        <p
          role="status"
          className={cn('flex items-center gap-2 text-xs', connected && 'text-highlight font-bold')}
        >
          {connected ? (
            <CheckCircle2 className="size-4" aria-hidden="true" />
          ) : (
            <PlugZap className="size-4" aria-hidden="true" />
          )}
          {connecting
            ? 'Aguardando a carteira…'
            : connected
              ? 'Carteira conectada'
              : 'Carteira desconectada'}
        </p>
        <Button
          ref={buttonRef}
          type="button"
          variant="outline"
          size="sm"
          disabled={connecting}
          onClick={connected ? onDisconnect : onConnect}
        >
          {connected ? 'Desconectar' : 'Conectar carteira'}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-destructive mt-2 text-xs">
          {error}
        </p>
      )}
    </div>
  )
}
