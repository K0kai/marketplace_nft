import { useState } from 'react'
import { CATEGORY_LABELS, NETWORK_LABELS, type CatalogResponse } from '@/api/contracts'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import type { CatalogSearch } from './search-schema'

type Props = {
  search: CatalogSearch
  facets: CatalogResponse['facets'] | undefined
  onChange: (patch: Partial<CatalogSearch>) => void
}

function Option({
  label,
  count,
  selected,
  onClick,
}: {
  label: string
  count: number
  selected: boolean
  onClick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onClick}
        className={cn(
          'text-muted-foreground hover:text-highlight flex w-full justify-between px-3 py-2 text-left text-xs',
          selected && 'text-highlight bg-secondary font-bold',
        )}
      >
        <span>
          {selected && <span aria-hidden="true">✓ </span>}
          {label}
        </span>
        <span>({count})</span>
      </button>
    </li>
  )
}

const brl = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function PriceFilter({ search, facets, onChange }: Props & { facets: CatalogResponse['facets'] }) {
  const min = Number(facets.priceRange.min)
  const max = Math.max(Number(facets.priceRange.max), min + 0.01)
  const fromUrl = [Number(search.minPrice ?? min), Number(search.maxPrice ?? max)]
  const urlKey = fromUrl.join('-')

  const [draft, setDraft] = useState({ key: urlKey, value: fromUrl })
  // a URL manda: voltar no histórico reposiciona o slider
  if (draft.key !== urlKey) setDraft({ key: urlKey, value: fromUrl })
  const [low = min, high = max] = draft.value

  return (
    <fieldset className="mt-6">
      <legend className="mb-3 text-sm font-bold">Faixa de preço</legend>
      <Slider
        className="px-2"
        min={min}
        max={max}
        step={0.01}
        value={draft.value}
        thumbLabels={['Preço mínimo em ETH', 'Preço máximo em ETH']}
        onValueChange={(value) => setDraft({ key: urlKey, value })}
      />
      <p className="my-3 text-xs">
        Preço: {brl(low)} – {brl(high)} ETH
      </p>
      <Button
        size="sm"
        onClick={() =>
          onChange({
            minPrice: low > min ? low.toFixed(2) : undefined,
            maxPrice: high < max ? high.toFixed(2) : undefined,
          })
        }
      >
        Aplicar
      </Button>
    </fieldset>
  )
}

export function FiltersPanel(props: Props) {
  const { search, facets, onChange } = props

  if (!facets) {
    return (
      <div className="bg-card flex flex-col gap-3 p-4" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => (
          <Skeleton key={index} className="h-5" />
        ))}
      </div>
    )
  }

  const hasFilters = Boolean(
    search.q || search.category || search.network || search.minPrice || search.maxPrice,
  )

  return (
    <div className="bg-card p-4">
      <h2 className="mb-2 text-sm font-bold">Coleções</h2>
      <ul>
        {facets.categories.map(({ id, count }) => (
          <Option
            key={id}
            label={CATEGORY_LABELS[id]}
            count={count}
            selected={search.category === id}
            onClick={() => onChange({ category: search.category === id ? undefined : id })}
          />
        ))}
      </ul>

      <PriceFilter {...props} facets={facets} />

      <h2 className="mt-6 mb-2 text-sm font-bold">Rede</h2>
      <ul>
        {facets.networks.map(({ id, count }) => (
          <Option
            key={id}
            label={NETWORK_LABELS[id]}
            count={count}
            selected={search.network === id}
            onClick={() => onChange({ network: search.network === id ? undefined : id })}
          />
        ))}
      </ul>

      {hasFilters && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4 w-full"
          onClick={() =>
            onChange({
              q: undefined,
              category: undefined,
              network: undefined,
              minPrice: undefined,
              maxPrice: undefined,
            })
          }
        >
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
