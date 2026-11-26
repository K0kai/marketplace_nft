import { Link } from '@tanstack/react-router'
import { NftImage } from '@/components/nft-image'
import { Skeleton } from '@/components/ui/skeleton'
import { useHighlights } from './queries'

export function FeaturedCard() {
  const featured = useHighlights().data?.featured
  return (
    <section className="bg-card mt-4 pt-4 text-center">
      <h2 className="text-highlight text-base font-bold">NFT EM DESTAQUE</h2>
      <p className="mt-1 mb-3 text-sm font-bold">OFERTA LIMITADA</p>
      {featured ? (
        <Link to="/nft/$nftId" params={{ nftId: featured.id }} className="block">
          <NftImage
            artwork={featured.artwork}
            alt={`NFT em destaque: ${featured.name}`}
            sizes="270px"
            className="rounded-[18px]"
          />
        </Link>
      ) : (
        <Skeleton className="aspect-square w-full rounded-[18px]" />
      )}
    </section>
  )
}
