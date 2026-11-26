import { useId } from 'react'
import { SORT_LABELS, catalogSortSchema, type CatalogSort } from '@/api/contracts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { CatalogSearch } from './search-schema'

export function SortSelect({
  value,
  onChange,
  className,
}: {
  value: CatalogSearch['sort']
  onChange: (patch: Partial<CatalogSearch>) => void
  className?: string
}) {
  const labelId = useId()
  return (
    <div className={cn('flex items-center gap-1 text-xs', className)}>
      <span id={labelId}>Ordenar por:</span>
      <Select
        value={value ?? 'recent'}
        onValueChange={(next) =>
          onChange({ sort: next === 'recent' ? undefined : (next as CatalogSearch['sort']) })
        }
      >
        <SelectTrigger aria-labelledby={labelId} className="h-8! border-0 px-1 text-xs md:text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-card" position="popper" align="end">
          {catalogSortSchema.options.map((option: CatalogSort) => (
            <SelectItem key={option} value={option}>
              {SORT_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
