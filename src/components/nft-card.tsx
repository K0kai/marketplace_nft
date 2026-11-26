import { Link } from '@tanstack/react-router'
import { Heart, Search, ShoppingCart } from 'lucide-react'
import type { NftSummary } from '@/api/contracts'
import { Skeleton } from '@/components/ui/skeleton'
import { useAddToCart } from '@/features/cart/queries'
import { useFavoriteToggle } from '@/features/favorites/queries'
import { defaultEdition, isSoldOut } from '@/lib/editions'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { NftImage } from './nft-image'
import { Price } from './price'

const CARD_SIZES = '(min-width: 64rem) 257px, (min-width: 48rem) 30vw, 42vw'

const actionClass =
  'bg-background/90 flex size-9 items-center justify-center rounded-[6px] text-foreground hover:text-highlight'

export function NftCard({ nft, priority = false }: { nft: NftSummary; priority?: boolean }) {
  const favorites = useFavoriteToggle()
  const addToCart = useAddToCart()
  const favorite = favorites.isFavorite(nft.id)
  const soldOut = isSoldOut(nft)

  function quickAdd() {
    const edition = defaultEdition(nft.editions)
    addToCart.mutate(
      { nftId: nft.id, editionId: edition.id, quantity: 1 },
      { onSuccess: () => toast.success(`${nft.name} adicionado ao carrinho.`) },
    )
  }

  return (
    <article className="group relative">
      <div className="bg-card relative rounded-[18px] p-2 md:rounded-none md:px-1 md:py-4">
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          tabIndex={-1}
          aria-hidden="true"
          className="block"
        >
          <NftImage
            artwork={nft.artwork}
            alt=""
            sizes={CARD_SIZES}
            priority={priority}
            className={cn('rounded-[14px]', soldOut && 'opacity-50 grayscale')}
          />
        </Link>

        {(nft.rare || soldOut) && (
          <span
            className={cn(
              'absolute top-5 left-0 px-4 py-1 text-xs font-bold md:top-4',
              soldOut ? 'bg-destructive text-background' : 'bg-primary text-primary-foreground',
            )}
          >
            {soldOut ? 'ESGOTADO' : 'RARO'}
          </span>
        )}

        {/* no desktop aparecem no hover ou no foco; no celular fica só o favorito */}
        <div className="absolute top-3 right-3 flex gap-2 transition-opacity md:inset-x-0 md:top-auto md:right-auto md:bottom-5 md:justify-center md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
          <button
            type="button"
            className={cn(actionClass, 'max-md:hidden')}
            onClick={quickAdd}
            disabled={soldOut || addToCart.isPending}
            aria-label={`Adicionar ${nft.name} ao carrinho`}
          >
            <ShoppingCart className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={cn(actionClass, 'max-md:rounded-full', favorite && 'text-highlight')}
            onClick={() => favorites.toggle(nft)}
            aria-pressed={favorite}
            aria-label={`Favoritar ${nft.name}`}
          >
            <Heart className={cn('size-5', favorite && 'fill-current')} aria-hidden="true" />
          </button>
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            className={cn(actionClass, 'max-md:hidden')}
            aria-label={`Ver detalhes de ${nft.name}`}
          >
            <Search className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
      <h3 className="mt-3 truncate px-1 text-sm md:px-0">
        <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="hover:text-highlight">
          {nft.name}
        </Link>
      </h3>
      <p className="px-1 text-sm md:px-0">
        <Price value={nft.price} previous={nft.previousPrice} />
      </p>
    </article>
  )
}

export function NftCardSkeleton() {
  return (
    <div>
      <div className="bg-card rounded-[18px] p-2 md:rounded-none md:px-1 md:py-4">
        <Skeleton className="aspect-square w-full rounded-[14px]" />
      </div>
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-1 h-4 w-1/3" />
    </div>
  )
}
