import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { ErrorState } from '@/components/states'

export function RouteErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <div className="page-container py-16">
      <h1 className="sr-only">Erro</h1>
      <ErrorState
        error={error}
        onRetry={() => {
          reset()
          void router.invalidate()
        }}
      />
    </div>
  )
}
