import { useState } from 'react'
import type { Wallet } from '@/api/contracts'
import { ErrorState, Loading } from '@/components/states'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useWallets } from './queries'
import { emptyWallet, WalletForm } from './wallet-form'

const addClass = 'text-highlight text-sm font-bold'

/** Copia a principal, mas pede um apelido próprio para diferenciar no pagamento. */
function copyOfPrimary(primary: Wallet) {
  const { id: _, slot: _slot, ...data } = primary
  return { ...data, slot: 'secondary' as const, nickname: 'Reserva' }
}

function SecondarySection({ primary, secondary }: { primary?: Wallet; secondary?: Wallet }) {
  const [adding, setAdding] = useState(false)
  const [sameAsPrimary, setSameAsPrimary] = useState(false)

  return (
    <section aria-labelledby="secondary-title" className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="secondary-title" className="text-base font-bold">
          Carteira secundária
        </h2>
        {!secondary && (
          <div className="flex items-center gap-3">
            <Label className="gap-2 text-xs font-normal">
              <Checkbox
                checked={sameAsPrimary}
                disabled={!primary}
                onCheckedChange={(checked) => setSameAsPrimary(checked === true)}
                className="border-primary rounded-full"
              />
              Igual à carteira principal
            </Label>
            <button
              type="button"
              className={addClass}
              aria-expanded={adding}
              onClick={() => setAdding((open) => !open)}
            >
              {adding ? 'Cancelar' : 'Adicionar'}
              <span className="sr-only"> carteira secundária</span>
            </button>
          </div>
        )}
      </div>

      {secondary ? (
        <WalletForm slot="secondary" wallet={secondary} />
      ) : adding ? (
        <WalletForm
          // remonta ao marcar a cópia, para os campos receberem os valores
          key={String(sameAsPrimary)}
          slot="secondary"
          defaults={sameAsPrimary && primary ? copyOfPrimary(primary) : emptyWallet('secondary')}
          onSaved={() => setAdding(false)}
        />
      ) : (
        <p className="text-muted-foreground mt-2 text-xs">
          Você ainda não adicionou uma carteira secundária.
        </p>
      )}
    </section>
  )
}

export function WalletsPage() {
  useDocumentTitle('Carteiras')
  const wallets = useWallets()
  const [addingPrimary, setAddingPrimary] = useState(false)
  const primary = wallets.data?.find((w) => w.slot === 'primary')
  const secondary = wallets.data?.find((w) => w.slot === 'secondary')

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-base font-bold">Carteira principal</h1>
        {wallets.data && !primary && !addingPrimary && (
          <button type="button" className={addClass} onClick={() => setAddingPrimary(true)}>
            Adicionar<span className="sr-only"> carteira principal</span>
          </button>
        )}
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
      </p>

      {wallets.isPending ? (
        <Loading label="Carregando carteiras" className="mt-5 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-[74px]" />
          ))}
        </Loading>
      ) : wallets.isError && !wallets.data ? (
        <ErrorState error={wallets.error} onRetry={() => void wallets.refetch()} className="mt-5" />
      ) : (
        <>
          {primary ? (
            <WalletForm key={primary.id} slot="primary" wallet={primary} />
          ) : addingPrimary ? (
            <WalletForm slot="primary" onSaved={() => setAddingPrimary(false)} />
          ) : (
            <p className="text-muted-foreground mt-4 text-xs">
              Você ainda não adicionou uma carteira principal.
            </p>
          )}
          <SecondarySection key={secondary?.id ?? 'none'} primary={primary} secondary={secondary} />
        </>
      )}
    </>
  )
}
