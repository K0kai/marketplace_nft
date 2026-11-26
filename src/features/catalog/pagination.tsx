import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CatalogSearch } from './search-schema'

const cell =
  'flex size-9 items-center justify-center rounded-[4px] border border-border text-sm hover:border-primary'

function pagesToShow(current: number, total: number): (number | '…')[] {
  const wanted = new Set([1, total, current - 1, current, current + 1])
  const pages = [...wanted].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  return pages.flatMap((page, i) =>
    i > 0 && page - pages[i - 1]! > 1 ? (['…', page] as const) : [page],
  )
}

/** Links de verdade: cada página entra no histórico e pode ser aberta em outra aba. */
export function Pagination({
  search,
  page,
  totalPages,
}: {
  search: CatalogSearch
  page: number
  totalPages: number
}) {
  if (totalPages <= 1) return null
  const to = (target: number) => ({ ...search, page: target > 1 ? target : undefined })

  return (
    <nav aria-label="Paginação do catálogo" className="mt-10 flex justify-center md:justify-end">
      <ul className="flex flex-wrap items-center gap-2">
        {page > 1 && (
          <li>
            <Link
              to="/"
              search={to(page - 1)}
              hash="catalogo"
              className={cell}
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Link>
          </li>
        )}
        {pagesToShow(page, totalPages).map((item, i) =>
          item === '…' ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                to="/"
                search={to(item)}
                hash="catalogo"
                aria-label={`Página ${item}`}
                aria-current={item === page ? 'page' : undefined}
                activeProps={{ 'aria-current': item === page ? 'page' : undefined }}
                className={cn(
                  cell,
                  item === page && 'bg-primary border-primary text-primary-foreground font-bold',
                )}
              >
                {item}
              </Link>
            </li>
          ),
        )}
        {page < totalPages && (
          <li>
            <Link
              to="/"
              search={to(page + 1)}
              hash="catalogo"
              className={cell}
              aria-label="Próxima página"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
