import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { EDITION_LABELS, type Quote } from '@/api/contracts'
import { NftImage } from '@/components/nft-image'
import { Price } from '@/components/price'
import { CouponForm } from '@/features/cart/coupon-form'
import { OrderTotals, TotalsSkeleton } from '@/features/cart/order-totals'

export function OrderSummary({
  quote,
  couponCode,
}: {
  quote: Quote | undefined
  couponCode: string | null
}) {
  const [showCoupon, setShowCoupon] = useState(false)

  return (
    <section aria-labelledby="your-nfts">
      <h2 id="your-nfts" className="text-sm font-bold">
        Seus NFTs
      </h2>
      <div
        aria-hidden="true"
        className="border-line-strong/60 mt-1 flex justify-between border-b pb-2 text-sm font-bold"
      >
        <span>NFTs</span>
        <span>Subtotal</span>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {quote?.items.map((item) => (
          <li key={item.id} className="bg-card flex items-center gap-3 pr-3">
            <NftImage
              artwork={item.artwork}
              alt=""
              sizes="60px"
              className="w-14 shrink-0 rounded-[6px]"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold break-words">{item.name}</span>
              <span className="text-subtle block text-[11px]">
                ID do token: #{item.tokenId} · {EDITION_LABELS[item.editionId]}
              </span>
            </span>
            <span className="text-subtle text-[11px] whitespace-nowrap">(x {item.quantity})</span>
            <Price value={item.lineTotal} className="text-sm" />
          </li>
        ))}
      </ul>

      <div className="my-3 text-center text-xs">
        {couponCode || showCoupon ? (
          <div className="text-left">
            <CouponForm appliedCode={couponCode} />
          </div>
        ) : (
          <button type="button" onClick={() => setShowCoupon(true)}>
            Tem um código promocional? <span className="text-highlight">Aplique aqui</span>
          </button>
        )}
      </div>
      {quote?.couponError && (
        <p role="alert" className="text-destructive mb-2 text-xs">
          {quote.couponError}
        </p>
      )}

      {quote ? (
        <OrderTotals totals={{ ...quote, couponCode: quote.coupon?.code }} />
      ) : (
        <TotalsSkeleton />
      )}
      <Link to="/cart" className="text-highlight mt-3 block text-right text-xs">
        Editar carrinho
      </Link>
    </section>
  )
}
