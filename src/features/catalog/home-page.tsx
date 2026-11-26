import { useNavigate } from '@tanstack/react-router'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useIsDesktop, useMediaQuery } from '@/hooks/use-media-query'
import { CatalogSection } from './catalog-section'
import { Editorial } from './editorial'
import { FeaturedCard } from './featured-card'
import { FiltersPanel } from './filters-panel'
import { Hero } from './hero'
import { useCatalog } from './queries'
import type { CatalogSearch } from './search-schema'
import { SortSelect } from './sort-select'

function MobileSearch({
  value,
  onSearch,
}: {
  value: string
  onSearch: (q: string | undefined) => void
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = String(new FormData(event.currentTarget).get('q') ?? '').trim()
    onSearch(q || undefined)
  }
  return (
    <form
      role="search"
      onSubmit={submit}
      className="bg-card flex h-12 flex-1 items-center gap-2 rounded-[14px] px-3"
    >
      <Search className="text-subtle size-5" aria-hidden="true" />
      <input
        key={value}
        name="q"
        type="search"
        defaultValue={value}
        aria-label="Explorar coleções"
        placeholder="Explorar coleções"
        className="placeholder:text-subtle min-w-0 flex-1 bg-transparent text-base font-bold"
      />
    </form>
  )
}

export function HomePage({ search }: { search: CatalogSearch }) {
  useDocumentTitle('Marketplace de NFTs')
  const navigate = useNavigate()
  // o que não aparece no tamanho atual nem é montado: assim não baixa imagens à toa
  const isDesktop = useIsDesktop()
  const hasSidebar = useMediaQuery('(min-width: 64rem)')
  const catalog = useCatalog(search)
  const [filtersOpen, setFiltersOpen] = useState(false)
  // o painel tem dois botões (celular e tablet): o foco volta para o que foi usado
  const openerRef = useRef<HTMLElement | null>(null)
  const openFilters = (event: React.MouseEvent<HTMLElement>) => {
    openerRef.current = event.currentTarget
    setFiltersOpen(true)
  }

  // qualquer mudança de filtro volta para a primeira página
  const change = (patch: Partial<CatalogSearch>) =>
    void navigate({
      to: '/',
      search: { ...search, ...patch, page: undefined },
      resetScroll: false,
    })

  const filters = <FiltersPanel search={search} facets={catalog.data?.facets} onChange={change} />

  return (
    <div className="page-container">
      <div className="flex gap-2 py-4 md:hidden">
        <MobileSearch value={search.q ?? ''} onSearch={(q) => change({ q })} />
        <Button
          variant="pill"
          aria-label="Abrir filtros"
          aria-haspopup="dialog"
          className="size-12 rounded-[14px]"
          onClick={openFilters}
        >
          <SlidersHorizontal className="size-5!" aria-hidden="true" />
        </Button>
      </div>

      <Hero />

      <div
        id="catalogo"
        className="mt-6 scroll-mt-4 md:mt-14 md:grid md:gap-8 lg:grid-cols-[270px_minmax(0,1fr)]"
      >
        {hasSidebar && (
          <aside aria-label="Filtros do catálogo">
            {filters}
            <FeaturedCard />
          </aside>
        )}
        <div className="min-w-0">
          {/* no tablet os filtros também ficam num painel */}
          <Button
            variant="outline"
            size="sm"
            className="mb-4 max-md:hidden lg:hidden"
            aria-haspopup="dialog"
            onClick={openFilters}
          >
            <SlidersHorizontal aria-hidden="true" /> Filtros
          </Button>
          <CatalogSection search={search} catalog={catalog} onChange={change} />
        </div>
      </div>

      {isDesktop && <Editorial />}

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] overflow-y-auto rounded-t-[24px]"
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            openerRef.current?.focus()
          }}
        >
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>Os resultados atualizam conforme você escolhe.</SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <SortSelect value={search.sort} onChange={change} className="mb-4 md:hidden" />
            {filters}
          </div>
          <div className="bg-background sticky bottom-0 p-4">
            <Button className="w-full" onClick={() => setFiltersOpen(false)}>
              Ver {catalog.data?.total ?? ''} resultados
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
