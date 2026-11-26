import { RadioGroup } from 'radix-ui'
import { EDITION_LABELS, type Edition, type EditionId } from '@/api/contracts'
import { cn } from '@/lib/utils'

export function EditionPicker({
  editions,
  value,
  onChange,
}: {
  editions: Edition[]
  value: EditionId
  onChange: (id: EditionId) => void
}) {
  return (
    <div>
      <p id="edition-label" className="text-sm font-bold">
        Edição:
      </p>
      <RadioGroup.Root
        aria-labelledby="edition-label"
        value={value}
        onValueChange={(next) => onChange(next as EditionId)}
        className="mt-2 flex flex-wrap gap-2"
      >
        {editions.map((edition) => {
          const soldOut = edition.available === 0
          return (
            <RadioGroup.Item
              key={edition.id}
              value={edition.id}
              className={cn(
                'border-border text-muted-foreground min-w-9 rounded-full border px-2.5 py-1 text-xs',
                'data-[state=checked]:border-primary data-[state=checked]:text-highlight data-[state=checked]:font-bold',
                soldOut && 'text-subtle line-through',
              )}
            >
              {EDITION_LABELS[edition.id]}
              {soldOut && <span className="sr-only"> (esgotada)</span>}
            </RadioGroup.Item>
          )
        })}
      </RadioGroup.Root>
    </div>
  )
}
