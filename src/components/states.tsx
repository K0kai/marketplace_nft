import { AlertTriangle, PackageOpen, RotateCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { errorMessage } from '@/api/errors'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ErrorState({
  error,
  title = 'Não foi possível carregar',
  onRetry,
  retrying = false,
  className,
}: {
  error: unknown
  title?: string
  onRetry?: () => void
  retrying?: boolean
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn('bg-card flex flex-col items-center gap-3 p-8 text-center', className)}
    >
      <AlertTriangle className="text-destructive size-8" aria-hidden="true" />
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-muted-foreground text-sm">{errorMessage(error)}</p>
      {onRetry && (
        <Button onClick={onRetry} disabled={retrying}>
          <RotateCw className={cn(retrying && 'animate-spin')} aria-hidden="true" />
          {retrying ? 'Tentando…' : 'Tentar novamente'}
        </Button>
      )}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="bg-card flex flex-col items-center gap-3 p-10 text-center">
      <PackageOpen className="text-primary size-9" aria-hidden="true" />
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <p className="text-muted-foreground max-w-md text-sm">{description}</p>}
      {children}
    </div>
  )
}

/** Contêiner dos skeletons: anuncia o carregamento uma única vez para leitores de tela. */
export function Loading({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}
