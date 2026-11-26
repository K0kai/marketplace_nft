import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonClass =
  'gradient-pill flex h-9 w-6 items-center justify-center rounded-full text-primary-foreground disabled:opacity-40 md:w-7'

export function QuantityStepper({
  value,
  max,
  onChange,
  label,
  busy = false,
  className,
}: {
  value: number
  max: number
  onChange: (next: number) => void
  // nome do item: "Quantidade de Emerald Ape #042"
  label: string
  busy?: boolean
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={`Quantidade de ${label}`}
      className={cn('flex items-center gap-3', className)}
    >
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(value - 1)}
        disabled={busy || value <= 1}
        aria-label={`Diminuir quantidade de ${label}`}
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <span aria-live="polite" className="min-w-5 text-center tabular-nums">
        {value}
      </span>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(value + 1)}
        disabled={busy || value >= max}
        aria-label={`Aumentar quantidade de ${label}`}
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
