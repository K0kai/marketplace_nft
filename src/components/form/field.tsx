import { useId, type ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type ControlProps = {
  id: string
  'aria-invalid': boolean
  'aria-describedby': string | undefined
  'aria-required': boolean | undefined
}

/** Liga rótulo, campo e mensagem de erro (id, aria-invalid e aria-describedby). */
export function Field({
  label,
  error,
  required = false,
  hideLabel = false,
  hint,
  className,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  hideLabel?: boolean
  hint?: string
  className?: string
  children: (control: ControlProps) => ReactNode
}) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className={cn('gap-0.5 text-sm font-normal', hideLabel && 'sr-only')}>
        {label}
        {required && (
          <span aria-hidden="true" className="text-destructive text-lg leading-none">
            *
          </span>
        )}
      </Label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': describedBy,
        'aria-required': required || undefined,
      })}
      {hint && (
        <p id={hintId} className="text-subtle text-xs">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  )
}

/** Erro do formulário como um todo (falha de rede, conflito sem campo específico). */
export function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="border-destructive text-destructive border px-3 py-2 text-sm">
      {message}
    </p>
  )
}
