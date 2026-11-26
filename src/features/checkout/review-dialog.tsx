import { Link } from '@tanstack/react-router'
import { EDITION_LABELS, NETWORK_LABELS, PROVIDER_LABELS, type Quote } from '@/api/contracts'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { OrderTotals } from '@/features/cart/order-totals'
import { formatEth } from '@/lib/eth'
import type { CheckoutValues } from './form-schema'
import type { useSubmitOrder } from './use-submit-order'
import { shortAddress } from './wallet-selection'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  values: CheckoutValues
  quote: Quote
  isStale: boolean
  previousTotal: string | undefined
  onAcceptQuote: () => void
  updating: boolean
  onSend: () => void
  order: ReturnType<typeof useSubmitOrder>
}

export function ReviewDialog(props: Props) {
  const { open, onOpenChange, values, quote, isStale, updating, order } = props
  const pendingId =
    order.error?.code === 'PENDING_ORDER'
      ? (order.error.details as { orderId?: string } | undefined)?.orderId
      : undefined
  const canSend = !isStale && !updating && quote.purchasable && !order.sending

  return (
    <Dialog open={open} onOpenChange={(next) => !order.sending && onOpenChange(next)}>
      <DialogContent className="bg-card max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogTitle>Revise seu pedido</DialogTitle>
        <DialogDescription>Confira os valores antes de enviar para a rede.</DialogDescription>

        <ul className="flex flex-col gap-2 text-sm">
          {quote.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>
                {item.name} · {EDITION_LABELS[item.editionId]} (x {item.quantity})
                {item.issue && (
                  <strong className="text-destructive block text-xs">Indisponível</strong>
                )}
              </span>
              <span className="whitespace-nowrap">{formatEth(item.lineTotal)} ETH</span>
            </li>
          ))}
        </ul>

        <dl className="border-border grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-y py-3 text-xs">
          <dt className="text-subtle">Carteira</dt>
          <dd>
            {PROVIDER_LABELS[values.walletType]} · {shortAddress(values.walletAddress)}
          </dd>
          <dt className="text-subtle">Rede</dt>
          <dd>{NETWORK_LABELS[values.network]}</dd>
          <dt className="text-subtle">E-mail</dt>
          <dd className="break-all">{values.email}</dd>
        </dl>

        <OrderTotals totals={{ ...quote, couponCode: quote.coupon?.code }} feeNote={false} />

        {isStale && (
          <div role="alert" className="border-destructive border p-3 text-xs">
            <p className="font-bold">Os valores mudaram desde a sua revisão.</p>
            {props.previousTotal && (
              <p className="mt-1">
                Total anterior {formatEth(props.previousTotal)} ETH · novo total{' '}
                {formatEth(quote.total)} ETH.
              </p>
            )}
            <Button size="sm" className="mt-2" onClick={props.onAcceptQuote} disabled={updating}>
              Aceitar novos valores
            </Button>
          </div>
        )}
        {!quote.purchasable && (
          <p role="alert" className="text-destructive text-xs">
            Há itens indisponíveis.{' '}
            <Link to="/cart" className="underline">
              Ajuste o carrinho
            </Link>
            .
          </p>
        )}

        {order.error && (
          <div role="alert" className="text-destructive text-xs">
            <p>{order.error.message}</p>
            {order.error.isTransient && (
              <p className="text-foreground mt-1">
                O pedido pode ter sido criado. “Verificar pedido” reenvia com a mesma chave, sem
                gerar uma segunda compra.
              </p>
            )}
            {pendingId && (
              <Link
                to="/orders/$orderId"
                params={{ orderId: pendingId }}
                className="text-highlight underline"
              >
                Acompanhar o pedido pendente
              </Link>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={order.sending}>
            Voltar
          </Button>
          {order.unresolved && order.error?.isTransient ? (
            <Button onClick={order.recover} disabled={order.sending}>
              {order.sending ? 'Verificando…' : 'Verificar pedido'}
            </Button>
          ) : (
            <Button onClick={props.onSend} disabled={!canSend}>
              {order.sending ? 'Enviando…' : updating ? 'Atualizando valores…' : 'Enviar pedido'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
