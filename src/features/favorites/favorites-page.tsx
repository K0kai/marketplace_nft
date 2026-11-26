import { Link } from '@tanstack/react-router'
import { NftCard, NftCardSkeleton } from '@/components/nft-card'
import { EmptyState, ErrorState, Loading } from '@/components/states'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useFavorites } from './queries'

const GRID = 'mt-5 grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-3 lg:gap-x-6'

export function FavoritesPage() {
  useDocumentTitle('Lista de interesse')
  const favorites = useFavorites()

  return (
    <>
      <h1 className="text-base font-bold">Lista de interesse</h1>
      {favorites.isPending ? (
        <Loading label="Carregando favoritos" className={GRID}>
          {Array.from({ length: 3 }, (_, i) => (
            <NftCardSkeleton key={i} />
          ))}
        </Loading>
      ) : favorites.isError && !favorites.data ? (
        <ErrorState
          error={favorites.error}
          onRetry={() => void favorites.refetch()}
          className="mt-5"
        />
      ) : favorites.data!.items.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="Nenhum favorito ainda"
            description="Toque no coração de um NFT para guardá-lo aqui."
          >
            <Button asChild>
              <Link to="/">Explorar NFTs</Link>
            </Button>
          </EmptyState>
        </div>
      ) : (
        <ul className={GRID}>
          {favorites.data!.items.map((nft) => (
            <li key={nft.id}>
              <NftCard nft={nft} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
