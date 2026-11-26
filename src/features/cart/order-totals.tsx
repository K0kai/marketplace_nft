import type { Quote } from '@/api/contracts'
import { Loading } from '@/components/states'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEth, toWei } from '@/lib/eth'

type Totals = Pick<Quote, 'subtotal' | 'discount' | 'networkFee' | 'total'> & {
  couponCode?: string | null
}

export function OrderTotals({ totals, feeNote = true }: { totals: Totals; feeNote?: boolean }) {
  const hasDiscount = toWei(totals.discount) > 0n
  return (
    <dl className="flex flex-col gap-3 text-sm">
      <div className="flex justify-between gap-3">
        <dt>Subtotal</dt>
        <dd data-testid="subtotal">{formatEth(totals.subtotal)} ETH</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt>Desconto do lançamento{totals.couponCode ? ` (${totals.couponCode})` : ''}</dt>
        <dd data-testid="discount">
          (-) {hasDiscount ? `${formatEth(totals.discount)} ETH` : '00.00'}
        </dd>
      </div>
      <div className="flex flex-wrap justify-between gap-x-3">
        <dt>Taxa de rede</dt>
        <dd data-testid="fee">{formatEth(totals.networkFee)} ETH</dd>
        {feeNote && <dd className="text-highlight w-full text-right text-[11px]">Taxa estimada</dd>}
      </div>
      <div className="mt-2 flex justify-between gap-3 text-base font-bold">
        <dt>Total</dt>
        <dd data-testid="total" className="text-highlight">
          {formatEth(totals.total)} ETH
        </dd>
      </div>
    </dl>
  )
}

export function TotalsSkeleton() {
  return (
    <Loading label="Calculando valores" className="flex flex-col gap-3">
      <Skeleton className="h-5" />
      <Skeleton className="h-5" />
      <Skeleton className="h-9" />
      <Skeleton className="mt-2 h-6" />
    </Loading>
  )
}
