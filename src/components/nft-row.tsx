import { useRef, useState, type UIEvent } from 'react'
import type { NftSummary } from '@/api/contracts'
import { cn } from '@/lib/utils'
import { NftCard, NftCardSkeleton } from './nft-card'
import { Loading } from './states'

const ITEM = 'w-[44%] shrink-0 snap-start md:w-[31%] lg:w-[calc((100%-6rem)/5)]'

/** Faixa com rolagem lateral e pontos de paginação ("Mais desta coleção"). */
export function NftRow({
  title,
  items,
  loading,
}: {
  title: string
  items: NftSummary[] | undefined
  loading: boolean
}) {
  const track = useRef<HTMLUListElement>(null)
  const [page, setPage] = useState(0)
  const [pages, setPages] = useState(1)

  function onScroll(event: UIEvent<HTMLUListElement>) {
    const { scrollLeft, clientWidth, scrollWidth } = event.currentTarget
    setPages(Math.ceil(scrollWidth / clientWidth))
    setPage(Math.round(scrollLeft / clientWidth))
  }

  function measure(element: HTMLUListElement | null) {
    track.current = element
    if (element) setPages(Math.ceil(element.scrollWidth / element.clientWidth) || 1)
  }

  if (!loading && !items?.length) return null

  return (
    <section className="mt-16 md:mt-24">
      <h2 className="text-highlight border-line-strong/60 border-b pb-3 text-sm font-bold">
        {title}
      </h2>
      {loading ? (
        <Loading label={`Carregando: ${title}`} className="mt-6 flex gap-6 overflow-hidden">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={ITEM}>
              <NftCardSkeleton />
            </div>
          ))}
        </Loading>
      ) : (
        <>
          <ul
            ref={measure}
            onScroll={onScroll}
            className="mt-6 flex snap-x gap-4 overflow-x-auto pb-2 md:gap-6"
          >
            {items!.map((nft) => (
              <li key={nft.id} className={ITEM}>
                <NftCard nft={nft} />
              </li>
            ))}
          </ul>
          {pages > 1 && (
            <div className="mt-3 flex justify-center">
              {Array.from({ length: pages }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Ir para o grupo ${index + 1}`}
                  aria-current={index === page}
                  onClick={() => {
                    const element = track.current
                    element?.scrollTo({ left: index * element.clientWidth, behavior: 'smooth' })
                  }}
                  className="flex size-6 items-center justify-center"
                >
                  <span
                    className={cn(
                      'border-primary block size-2.5 rounded-full border',
                      index === page && 'bg-primary',
                    )}
                  />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
