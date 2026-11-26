import { Link } from '@tanstack/react-router'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { MobileTopBar } from '@/components/layout/mobile-nav'
import { NftRow } from '@/components/nft-row'
import { EmptyState, ErrorState, Loading } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRelatedNfts } from '@/features/catalog/queries'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { CartLine } from './cart-line'
import { CartNotices } from './cart-notices'
import { CouponForm } from './coupon-form'
import { OrderTotals, TotalsSkeleton } from './order-totals'
import { useCart, useQuote } from './queries'

const COLUMNS = 'grid-cols-[70px_minmax(0,2fr)_1fr_1fr_1fr_40px] gap-x-3'

function Summary() {
  const cart = useCart()
  // a taxa do carrinho é uma estimativa na rede principal; o checkout recalcula
  const quote = useQuote('ethereum')
  const purchasable = quote.data?.purchasable ?? false

  return (
    <section
      aria-labelledby="summary-title"
      className="max-md:bg-card h-fit max-md:-mx-4 max-md:mt-6 max-md:self-end max-md:rounded-t-[28px] max-md:p-6"
    >
      <h2
        id="summary-title"
        className="border-line-strong/60 mb-4 border-b pb-3 text-base font-bold max-md:sr-only"
      >
        Resumo da carteira
      </h2>
      <CouponForm appliedCode={cart.data?.couponCode ?? null} />
      {quote.data?.couponError && (
        <p role="alert" className="text-destructive mt-2 text-xs">
          {quote.data.couponError}
        </p>
      )}
      <div className="mt-5" aria-busy={quote.isFetching}>
        {quote.data ? (
          <OrderTotals totals={{ ...quote.data, couponCode: quote.data.coupon?.code }} />
        ) : quote.isError ? (
          <ErrorState error={quote.error} onRetry={() => void quote.refetch()} className="p-4" />
        ) : (
          <TotalsSkeleton />
        )}
      </div>

      {quote.data && !purchasable && (
        <p className="text-destructive mt-4 text-xs">
          Resolva os itens indisponíveis para finalizar.
        </p>
      )}
      {purchasable ? (
        <Button asChild size="lg" className="mt-5 w-full max-md:h-14 max-md:rounded-full">
          <Link to="/checkout">Conectar e finalizar</Link>
        </Button>
      ) : (
        <Button size="lg" disabled className="mt-5 w-full max-md:h-14 max-md:rounded-full">
          Conectar e finalizar
        </Button>
      )}
      <Link to="/" className="text-highlight mt-4 block text-center text-sm">
        Continuar explorando
      </Link>
    </section>
  )
}

export function CartPage() {
  useDocumentTitle('Carrinho de NFTs')
  const cart = useCart()
  const first = cart.data?.items[0]?.nftId ?? 'emerald-ape-042'
  const related = useRelatedNfts(first)
  const items = cart.data?.items ?? []

  return (
    <>
      <MobileTopBar title="Carrinho de NFTs" />
      {/* no celular o resumo encosta na base da tela, como no frame */}
      <div className="page-container max-md:flex max-md:min-h-[calc(100dvh-5.5rem)] max-md:flex-col">
        <div className="max-md:hidden">
          <Breadcrumbs
            items={[
              { label: 'Início', to: '/' },
              { label: 'Mercado', to: '/' },
              { label: 'Carrinho' },
            ]}
          />
        </div>
        <h1 className="sr-only">Carrinho de NFTs</h1>
        <CartNotices />

        {cart.isPending ? (
          <Loading label="Carregando carrinho" className="grid gap-12 md:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-24 md:h-[70px]" />
              ))}
            </div>
            <Skeleton className="h-80" />
          </Loading>
        ) : cart.isError && !cart.data ? (
          <ErrorState
            error={cart.error}
            title="Não foi possível carregar o carrinho"
            onRetry={() => void cart.refetch()}
            retrying={cart.isFetching}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Seu carrinho está vazio"
            description="Explore o mercado e escolha sua próxima obra."
          >
            <Button asChild>
              <Link to="/">Explorar NFTs</Link>
            </Button>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 max-md:flex-1 max-md:grid-rows-[auto_1fr] md:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_332px] lg:gap-24">
            <section aria-labelledby="items-title" className="min-w-0">
              <h2 id="items-title" className="sr-only">
                Itens no carrinho
              </h2>
              <div
                aria-hidden="true"
                className={`border-line-strong/60 mb-3 grid border-b pb-3 text-sm font-bold max-md:hidden ${COLUMNS}`}
              >
                <span className="col-span-2">NFTs</span>
                <span>Preço</span>
                <span>Edições</span>
                <span>Total</span>
              </div>
              <ul className="flex flex-col gap-4 md:gap-3">
                {items.map((item) => (
                  <CartLine key={item.id} item={item} />
                ))}
              </ul>
            </section>
            <Summary />
          </div>
        )}

        <div className="max-md:hidden">
          <NftRow
            title="Colecionadores também viram"
            items={related.data?.items}
            loading={related.isPending}
          />
        </div>
      </div>
    </>
  )
}
