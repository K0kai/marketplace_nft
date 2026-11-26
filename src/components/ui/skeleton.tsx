import { cn } from '@/lib/utils'

/** Bloco com shimmer. É decorativo: quem anuncia o carregamento é o contêiner (role="status"). */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton"
      className={cn('shimmer rounded-[6px]', className)}
      {...props}
    />
  )
}

export { Skeleton }
