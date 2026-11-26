import { Link } from '@tanstack/react-router'
import { Loader2, X, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { EDITION_LABELS, NETWORK_LABELS, PROVIDER_LABELS, type Order } from '@/api/contracts'
import { toApiError } from '@/api/errors'
import { NftImage } from '@/components/nft-image'
import { Price } from '@/components/price'
import { ErrorState, Loading } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { formatEth, toWei } from '@/lib/eth'
import { useOrder } from './queries'
import { ThankYouIcon } from './thank-you-icon'

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="bg-card border-b-primary relative mx-auto w-full max-w-[580px] border-b-[6px] pb-8">
      <Link
        to="/"
        aria-label="Fechar e voltar ao início"
        className="text-primary absolute top-3 right-3 flex size-9 items-center justify-center"
      >
        <X className="size-5" aria-hidden="true" />
      </Link>
      {children}
    </div>
  )
}

function Heading({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-10 pt-7 pb-5 text-center">
      {icon}
      <h1 className="text-muted-foreground text-sm font-bold">{title}</h1>
    </div>
  )
}

/** "29 Jul, 2026", como no layout. */
function formatDate(iso: string) {
  const date = new Date(iso)
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  const label = month.charAt(0).toUpperCase() + month.slice(1)
  return `${date.getDate()} ${label}, ${date.getFullYear()}`
}

const shortHash = (hash: string) => `${hash.slice(0, 6)}…${hash.slice(-4)}`

/** Lê somente o snapshot do pedido: o catálogo atual não interfere no recibo. */
function Receipt({ order }: { order: Order }) {
  const { receipt } = order
  return (
    <>
      <Heading icon={<ThankYouIcon />} title="Seus NFTs agora estão na sua carteira" />
      <dl className="border-primary text-muted-foreground divide-primary grid grid-cols-2 gap-y-3 border-y px-6 py-3 text-xs sm:grid-cols-4 sm:divide-x">
        {[
          ['ID da transação', shortHash(order.transaction.hash)],
          ['Data', formatDate(order.createdAt)],
          ['Total', `${formatEth(receipt.total)} ETH`],
          ['Carteira', PROVIDER_LABELS[order.wallet.provider]],
        ].map(([term, value]) => (
          <div key={term} className="sm:px-3 sm:first:pl-0">
            <dt>{term}</dt>
            <dd className="font-bold">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="px-5 pt-4 sm:px-8">
        <h2 className="text-xs font-bold">Detalhes da transação</h2>
        <div
          aria-hidden="true"
          className="border-line-strong/60 mt-2 grid grid-cols-[1fr_64px_88px] gap-3 border-b pb-2 text-xs font-bold"
        >
          <span>NFTs</span>
          <span className="text-center">Edições</span>
          <span className="text-right">Subtotal</span>
        </div>
        <ul className="mt-3 flex flex-col gap-3">
          {receipt.lines.map((line) => (
            <li key={`${line.nftId}-${line.editionId}`} className="flex items-center gap-3">
              <NftImage
                artwork={line.artwork}
                alt=""
                sizes="52px"
                className="w-13 shrink-0 rounded-[6px]"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold">{line.name}</span>
                <span className="text-subtle block text-[11px]">
                  ID do token: #{line.tokenId} · {EDITION_LABELS[line.editionId]}
                </span>
              </span>
              <span className="text-muted-foreground w-16 text-center text-xs">
                (x {line.quantity})
              </span>
              <Price value={line.lineTotal} className="w-[88px] justify-end text-sm" />
            </li>
          ))}
        </ul>
        <dl className="border-line-strong/60 mt-4 ml-auto flex max-w-xs flex-col gap-2 border-b pb-3 text-xs">
          {toWei(receipt.discount) > 0n && (
            <div className="flex justify-between">
              <dt>Desconto ({receipt.couponCode})</dt>
              <dd>(-) {formatEth(receipt.discount)} ETH</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Taxa de rede</dt>
            <dd>{formatEth(receipt.networkFee)} ETH</dd>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <dt>Total</dt>
            <dd data-testid="receipt-total" className="text-highlight">
              {formatEth(receipt.total)} ETH
            </dd>
          </div>
        </dl>
        <p className="text-muted-foreground mx-auto mt-4 max-w-md text-center text-xs leading-5">
          Transação confirmada na {NETWORK_LABELS[order.wallet.network]}. A propriedade foi
          transferida para sua carteira conectada e registrada na rede.
        </p>
        <div className="mt-5 text-center">
          <Button asChild>
            <Link to="/explorer/$hash" params={{ hash: order.transaction.hash }}>
              Ver no Etherscan
            </Link>
          </Button>
          <p className="text-subtle mt-2 text-[11px]">Explorador simulado para demonstração.</p>
        </div>
      </section>
    </>
  )
}

function Pending({ order }: { order: Order }) {
  return (
    <>
      <Heading
        icon={
          <Loader2
            className="text-primary size-14 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        }
        title="Pedido aguardando confirmação"
      />
      <div className="border-primary text-muted-foreground border-y px-8 py-4 text-center text-xs leading-5">
        <p>
          Total de <strong>{formatEth(order.receipt.total)} ETH</strong>. Estamos aguardando a rede{' '}
          {NETWORK_LABELS[order.wallet.network]}.
        </p>
        <p className="mt-2">
          Você pode fechar ou recarregar esta página: o pedido continua e nenhuma compra é
          duplicada. Seus itens seguem no carrinho até a confirmação.
        </p>
      </div>
    </>
  )
}

function Declined({ order }: { order: Order }) {
  return (
    <>
      <Heading
        icon={<XCircle className="text-destructive size-14" aria-hidden="true" />}
        title="Pagamento recusado"
      />
      <div className="border-primary border-y px-8 py-4 text-center text-xs leading-5">
        <p>{order.declineReason}</p>
        <p className="text-muted-foreground mt-2">
          Nada foi cobrado e seus itens continuam no carrinho.
        </p>
      </div>
      <div className="mt-5 flex justify-center gap-2">
        <Button asChild>
          <Link to="/checkout">Tentar pagar novamente</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/cart">Ver carrinho</Link>
        </Button>
      </div>
    </>
  )
}

const VIEWS = {
  pending: {
    title: 'Pedido pendente',
    component: Pending,
    announce: 'Pedido aguardando confirmação.',
  },
  confirmed: { title: 'Pedido confirmado', component: Receipt, announce: 'Pagamento confirmado.' },
  declined: { title: 'Pedido recusado', component: Declined, announce: 'Pagamento recusado.' },
}

export function OrderPage({ orderId }: { orderId: string }) {
  const order = useOrder(orderId)
  const view = order.data ? VIEWS[order.data.status] : null
  useDocumentTitle(view?.title ?? 'Pedido')

  const code = order.error ? toApiError(order.error).code : null

  return (
    <div className="flex min-h-dvh items-center px-4 py-10">
      {order.data && view ? (
        <div className="w-full" data-status={order.data.status}>
          <p role="status" className="sr-only">
            {view.announce}
          </p>
          <Card>
            <view.component order={order.data} />
          </Card>
        </div>
      ) : order.isError ? (
        <div className="mx-auto w-full max-w-md">
          <h1 className="sr-only">Pedido</h1>
          <ErrorState
            error={order.error}
            title={
              code === 'FORBIDDEN'
                ? 'Acesso negado'
                : code === 'NOT_FOUND'
                  ? 'Pedido não encontrado'
                  : 'Não foi possível carregar o pedido'
            }
            onRetry={
              code === 'FORBIDDEN' || code === 'NOT_FOUND' ? undefined : () => void order.refetch()
            }
          />
          <Button asChild variant="outline" className="mt-3 w-full">
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      ) : (
        <Loading label="Carregando pedido" className="mx-auto w-full max-w-[580px]">
          <Skeleton className="h-[560px]" />
        </Loading>
      )}
    </div>
  )
}
