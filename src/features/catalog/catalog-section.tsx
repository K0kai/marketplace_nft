import type { CatalogTab } from '@/api/contracts'
import { EmptyState, ErrorState, Loading } from '@/components/states'
import { NftCard, NftCardSkeleton } from '@/components/nft-card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Pagination } from './pagination'
import type { useCatalog } from './queries'
import type { CatalogSearch } from './search-schema'
import { SortSelect } from './sort-select'

const GRID = 'grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 md:gap-x-8 md:gap-y-10'

type Props = {
  search: CatalogSearch
  catalog: ReturnType<typeof useCatalog>
  onChange: (patch: Partial<CatalogSearch>) => void
}

function Results({ search, catalog, onChange }: Props) {
  if (catalog.isPending) {
    return (
      <Loading label="Carregando NFTs" className={GRID}>
        {Array.from({ length: 9 }, (_, index) => (
          <NftCardSkeleton key={index} />
        ))}
      </Loading>
    )
  }

  if (catalog.isError && !catalog.data) {
    return (
      <ErrorState
        error={catalog.error}
        title="Não foi possível carregar o catálogo"
        onRetry={() => void catalog.refetch()}
        retrying={catalog.isFetching}
      />
    )
  }

  const data = catalog.data!
  if (data.items.length === 0) {
    return (
      <EmptyState
        title="Nenhum NFT encontrado"
        description="Tente outro termo ou remova alguns filtros."
      >
        <Button
          onClick={() =>
            onChange({
              q: undefined,
              category: undefined,
              network: undefined,
              minPrice: undefined,
              maxPrice: undefined,
              tab: undefined,
            })
          }
        >
          Limpar filtros
        </Button>
      </EmptyState>
    )
  }

  return (
    <>
      {catalog.isError && (
        <p role="alert" className="text-destructive mb-3 text-xs">
          Não foi possível atualizar agora. Mostrando os últimos dados carregados.{' '}
          <button type="button" className="underline" onClick={() => void catalog.refetch()}>
            Tentar novamente
          </button>
        </p>
      )}
      <ul className={cn(GRID, 'transition-opacity', catalog.isPlaceholderData && 'opacity-60')}>
        {data.items.map((nft, index) => (
          // no celular a coluna da direita desce um pouco, como no layout
          <li key={nft.id} className="max-md:even:translate-y-5">
            <NftCard nft={nft} priority={index < 2} />
          </li>
        ))}
      </ul>
      <Pagination search={search} page={data.page} totalPages={data.totalPages} />
    </>
  )
}

export function CatalogSection(props: Props) {
  const { search, catalog, onChange } = props
  const tab: CatalogTab = search.tab ?? 'all'
  const total = catalog.data?.total
  const updating = catalog.isFetching && !catalog.isPending

  return (
    <Tabs
      value={tab}
      onValueChange={(value) =>
        onChange({ tab: value === 'all' ? undefined : (value as CatalogSearch['tab']) })
      }
      className="gap-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList aria-label="Seleções do catálogo" className="gap-3 md:gap-5">
          <TabsTrigger value="all">Todos os NFTs</TabsTrigger>
          <TabsTrigger value="new">Novos lançamentos</TabsTrigger>
          <TabsTrigger value="trending">Em alta</TabsTrigger>
        </TabsList>
        {/* no celular a ordenação fica no painel de filtros, como no frame */}
        <SortSelect value={search.sort} onChange={onChange} className="max-md:hidden" />
      </div>

      <h2 className="sr-only">Catálogo de NFTs</h2>

      {search.q && (
        <p className="text-sm">
          Resultados para <strong>“{search.q}”</strong>{' '}
          <button
            type="button"
            className="text-highlight underline"
            onClick={() => onChange({ q: undefined })}
          >
            limpar busca
          </button>
        </p>
      )}

      <p role="status" className="sr-only">
        {updating
          ? 'Atualizando resultados…'
          : total === undefined
            ? ''
            : `${total} NFTs encontrados`}
      </p>

      <TabsContent value={tab}>
        <Results {...props} />
      </TabsContent>
    </Tabs>
  )
}
