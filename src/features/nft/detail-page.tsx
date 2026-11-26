import { Link } from '@tanstack/react-router'
import { Heart, Mail, ShoppingCart, Star } from 'lucide-react'
import { NETWORK_LABELS, type EditionId, type NftDetail } from '@/api/contracts'
import { toApiError } from '@/api/errors'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { BackButton } from '@/components/layout/mobile-nav'
import { LinkedinIcon, TwitterIcon } from '@/components/layout/social-icons'
import { NftRow } from '@/components/nft-row'
import { Price } from '@/components/price'
import { QuantityStepper } from '@/components/quantity-stepper'
import { ErrorState, Loading } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNft, useRelatedNfts } from '@/features/catalog/queries'
import { useFavoriteToggle } from '@/features/favorites/queries'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useIsDesktop } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { EditionPicker } from './edition-picker'
import { Gallery } from './gallery'
import { usePurchase, type Purchase } from './use-purchase'

function Rating({ nft }: { nft: NftDetail }) {
  return (
    <p className="flex items-center gap-2 text-xs">
      <span aria-hidden="true" className="text-primary flex max-md:hidden">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={cn('size-3.5 fill-current', i === 4 && 'opacity-60')} />
        ))}
      </span>
      <span className="border-primary flex items-center gap-1 rounded-full border px-2 py-0.5 md:border-0 md:p-0">
        <Star className="text-primary size-3.5 fill-current md:hidden" aria-hidden="true" />
        <span className="sr-only">Nota </span>
        <span className="font-bold md:sr-only">{nft.rating}</span>
        <span className="max-md:hidden">{nft.reviewsCount} avaliações de colecionadores</span>
        <span className="md:hidden">({nft.reviewsCount})</span>
      </span>
    </p>
  )
}

function Metadata({ nft }: { nft: NftDetail }) {
  return (
    <dl className="text-subtle flex flex-col gap-2 text-sm">
      {[
        ['ID do token', `#${nft.tokenId}`],
        ['Coleção', nft.collection],
        ['Atributos', nft.attributes.join(', ')],
      ].map(([term, value]) => (
        <div key={term} className="flex flex-wrap gap-x-2">
          <dt>{term}:</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Share({ nft }: { nft: NftDetail }) {
  const url = encodeURIComponent(window.location.href)
  const text = encodeURIComponent(`${nft.name} na Kurio`)
  const links = [
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${url}`, LinkedinIcon],
    ['e-mail', `mailto:?subject=${text}&body=${url}`, Mail],
    ['X (Twitter)', `https://x.com/intent/tweet?text=${text}&url=${url}`, TwitterIcon],
  ] as const
  return (
    <div className="flex items-center gap-2 text-sm font-bold">
      <span>Compartilhar este NFT:</span>
      <ul className="flex gap-1">
        {links.map(([name, href, Icon]) => (
          <li key={name}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`Compartilhar por ${name}`}
              className="hover:text-highlight flex size-7 items-center justify-center"
            >
              <Icon className="size-4" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PurchaseHint({ purchase }: { purchase: Purchase }) {
  return (
    <p
      role="status"
      className={cn('text-xs', purchase.unavailableReason ? 'text-destructive' : 'text-subtle')}
    >
      {purchase.unavailableReason ??
        `${purchase.edition.available} disponível(is) · máximo de ${purchase.edition.maxPerOrder} por pedido${
          purchase.inCart > 0 ? ` · ${purchase.inCart} no carrinho` : ''
        }`}
    </p>
  )
}

function Stepper({ nft, purchase }: { nft: NftDetail; purchase: Purchase }) {
  return (
    <QuantityStepper
      label={nft.name}
      value={purchase.quantity}
      max={purchase.remaining}
      busy={Boolean(purchase.unavailableReason)}
      onChange={purchase.setQuantity}
    />
  )
}

function DesktopDetail({ nft, purchase }: { nft: NftDetail; purchase: Purchase }) {
  const favorites = useFavoriteToggle()
  const favorite = favorites.isFavorite(nft.id)

  return (
    <div className="grid grid-cols-2 gap-8">
      <Gallery nft={nft} />
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold">{nft.name}</h1>
        <div className="border-line-strong/60 flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <Price value={nft.price} previous={nft.previousPrice} className="text-lg" />
          <Rating nft={nft} />
        </div>
        <div>
          <h2 className="text-sm font-bold">Sobre este NFT:</h2>
          <p className="text-muted-foreground mt-2 text-xs leading-5">{nft.summary}</p>
        </div>
        <EditionPicker
          editions={nft.editions}
          value={purchase.edition.id}
          onChange={purchase.selectEdition}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Stepper nft={nft} purchase={purchase} />
          <div className="flex gap-2">
            <Button
              className="min-w-[116px] uppercase"
              onClick={() => purchase.add({ goToCart: true })}
              disabled={Boolean(purchase.unavailableReason) || purchase.adding}
            >
              {purchase.adding ? 'Adicionando…' : 'Comprar'}
            </Button>
            <Button variant="outline" onClick={() => favorites.toggle(nft)} aria-pressed={favorite}>
              <Heart className={cn(favorite && 'fill-primary text-primary')} aria-hidden="true" />
              Favoritar
            </Button>
          </div>
        </div>
        <PurchaseHint purchase={purchase} />
        <Metadata nft={nft} />
        <Share nft={nft} />
      </div>
    </div>
  )
}

function MobileDetail({ nft, purchase }: { nft: NftDetail; purchase: Purchase }) {
  const favorites = useFavoriteToggle()
  const favorite = favorites.isFavorite(nft.id)

  return (
    <>
      <div className="bg-secondary relative px-7 pt-5">
        <div className="mb-3 flex justify-between">
          <BackButton className="bg-card border-border border" />
          <button
            type="button"
            onClick={() => favorites.toggle(nft)}
            aria-pressed={favorite}
            aria-label={`Favoritar ${nft.name}`}
            className="bg-card text-highlight flex size-10 items-center justify-center rounded-full"
          >
            <Heart className={cn('size-5', favorite && 'fill-current')} aria-hidden="true" />
          </button>
        </div>
        <div className="pb-6">
          <Gallery nft={nft} />
        </div>
      </div>

      <div className="bg-card relative -mt-4 flex flex-col gap-3 rounded-t-[28px] px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold">{nft.name}</h1>
          <Rating nft={nft} />
        </div>
        <p className="text-muted-foreground text-sm leading-6">{nft.summary}</p>
        <EditionPicker
          editions={nft.editions}
          value={purchase.edition.id}
          onChange={purchase.selectEdition}
        />
        <PurchaseHint purchase={purchase} />
        <Metadata nft={nft} />
        <Share nft={nft} />
      </div>

      {/* barra de compra fixa, como no frame mobile */}
      <div className="bg-card fixed inset-x-0 bottom-0 z-30 rounded-t-[28px] px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgb(0_0_0/0.45)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="text-muted-foreground text-sm">
              Qtd.
            </span>
            <Stepper nft={nft} purchase={purchase} />
          </div>
          <Price value={nft.price} className="text-lg" />
        </div>
        <div className="mt-3 flex gap-3">
          <Button
            variant="pill"
            size="xl"
            className="flex-1"
            onClick={() => purchase.add({ goToCart: true })}
            disabled={Boolean(purchase.unavailableReason) || purchase.adding}
          >
            Comprar NFT
          </Button>
          <button
            type="button"
            onClick={() => purchase.add({ goToCart: false })}
            disabled={Boolean(purchase.unavailableReason) || purchase.adding}
            aria-label="Adicionar ao carrinho"
            className="bg-secondary text-muted-foreground flex size-14 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
          >
            <ShoppingCart className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  )
}

function LongDescription({ nft }: { nft: NftDetail }) {
  return (
    <Tabs defaultValue="details" className="mt-14 md:mt-20">
      <TabsList variant="line">
        <TabsTrigger value="details">Detalhes do NFT</TabsTrigger>
        <TabsTrigger value="reviews">Avaliações de colecionadores ({nft.reviewsCount})</TabsTrigger>
      </TabsList>
      <TabsContent value="details" className="text-muted-foreground pt-2 text-xs leading-5">
        {nft.description.map((paragraph) => (
          <p key={paragraph} className="mb-4">
            {paragraph}
          </p>
        ))}
        {[
          [
            'Rede',
            `Cunhado na ${NETWORK_LABELS[nft.network]} com procedência imutável e metadados armazenados no IPFS.`,
          ],
          ['Contrato', `${nft.contractAddress} · Contrato inteligente ERC-721 verificado.`],
          [
            'Direitos autorais',
            `Direitos autorais do criador: ${nft.royaltyPercent}% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.`,
          ],
        ].map(([title, text]) => (
          <div key={title} className="mb-3">
            <h2 className="text-foreground font-bold">{title}:</h2>
            <p>{text}</p>
          </div>
        ))}
      </TabsContent>
      <TabsContent value="reviews" className="pt-2">
        <ul className="flex flex-col gap-3">
          {nft.reviews.map((review) => (
            <li key={review.id} className="bg-card p-4 text-xs">
              <p className="font-bold">
                {review.author}
                <span className="text-highlight ml-2">
                  {review.rating}/5<span className="sr-only"> estrelas</span>
                </span>
              </p>
              <p className="text-muted-foreground mt-1">{review.comment}</p>
            </li>
          ))}
        </ul>
        <p className="text-subtle mt-3 text-xs">
          Mostrando {nft.reviews.length} de {nft.reviewsCount} avaliações.
        </p>
      </TabsContent>
    </Tabs>
  )
}

function DetailSkeleton() {
  return (
    <Loading
      label="Carregando detalhes do NFT"
      className="grid min-h-screen content-start gap-8 max-md:px-6 max-md:pt-16 md:grid-cols-2"
    >
      <div className="flex gap-6">
        <div className="flex flex-col gap-3.5 max-md:hidden">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="size-[90px]" />
          ))}
        </div>
        <Skeleton className="aspect-square flex-1 rounded-[22px]" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-24" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-10" />
        <Skeleton className="h-20 w-2/3" />
      </div>
    </Loading>
  )
}

function DetailContent({ nft, edition }: { nft: NftDetail; edition: EditionId | undefined }) {
  const isDesktop = useIsDesktop()
  const purchase = usePurchase(nft, edition)
  return isDesktop ? (
    <DesktopDetail nft={nft} purchase={purchase} />
  ) : (
    <MobileDetail nft={nft} purchase={purchase} />
  )
}

export function NftDetailPage({ nftId, edition }: { nftId: string; edition?: EditionId }) {
  const nft = useNft(nftId)
  const related = useRelatedNfts(nft.data?.id)
  const notFound = nft.isError && toApiError(nft.error).code === 'NOT_FOUND'
  useDocumentTitle(nft.data?.name ?? (notFound ? 'NFT não encontrado' : 'NFT'))

  if (notFound) {
    return (
      <div className="page-container flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-2xl font-bold">NFT não encontrado</h1>
        <p className="text-muted-foreground text-sm">
          Este item não existe ou foi removido do mercado.
        </p>
        <Button asChild>
          <Link to="/">Explorar o catálogo</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="md:page-container max-md:pb-48">
      <div className="max-md:hidden">
        <Breadcrumbs
          items={[
            { label: 'Início', to: '/' },
            { label: 'Mercado', to: '/' },
          ]}
        />
      </div>

      {nft.data ? (
        <DetailContent key={nft.data.id} nft={nft.data} edition={edition} />
      ) : nft.isError ? (
        <div className="p-6">
          <h1 className="sr-only">Detalhes do NFT</h1>
          <ErrorState
            error={nft.error}
            onRetry={() => void nft.refetch()}
            retrying={nft.isFetching}
          />
        </div>
      ) : (
        <DetailSkeleton />
      )}

      <div className="max-md:px-6">
        {nft.data && <LongDescription nft={nft.data} />}
        {nft.data && (
          <NftRow
            title="Mais desta coleção"
            items={related.data?.items}
            loading={related.isPending}
          />
        )}
      </div>
    </div>
  )
}
