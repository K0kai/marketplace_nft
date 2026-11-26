import { formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'

export function Price({
  value,
  previous,
  className,
}: {
  value: string
  previous?: string | null
  className?: string
}) {
  return (
    <span className={cn('text-highlight font-bold whitespace-nowrap', className)}>
      {formatEth(value)} ETH
      {previous && (
        <s className="text-subtle ml-2 font-normal">
          <span className="sr-only">preço anterior </span>
          {formatEth(previous)} ETH
        </s>
      )}
    </span>
  )
}
