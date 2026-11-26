import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { NftImage } from '@/components/nft-image'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useHighlights } from './queries'

/** Destaques sem autoplay: quem troca é o usuário (melhor para leitura e movimento reduzido). */
export function Hero() {
  const highlights = useHighlights()
  const [index, setIndex] = useState(0)
  const items = highlights.data?.hero ?? []
  const current = items[index]
  const next = items[(index + 1) % items.length]

  return (
    <section
      aria-label="Destaques"
      className="relative grid grid-cols-[1.25fr_1fr] items-center gap-3 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#6b4527] to-[#2a1b13] p-4 md:grid-cols-[1.15fr_1fr] md:gap-8 md:rounded-none md:bg-none md:px-6 md:py-4"
    >
      <div>
        <p className="text-xs md:text-[11px] md:font-bold md:tracking-widest">Bem-vindo à Kurio</p>
        <h1 className="mt-2 text-lg leading-tight font-bold uppercase md:mt-4 md:text-3xl md:leading-[1.5] lg:text-[40px]">
          {/* o frame mobile tem uma chamada própria, mais curta */}
          <span className="max-md:hidden">Seja dono do futuro da arte digital</span>
          <span className="md:hidden">Seja dono da cultura digital</span>
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md text-xs md:mt-3 md:leading-5">
          <span className="max-md:hidden">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
            rara, apoie artistas e tenha uma parte da cultura da internet.
          </span>
          <span className="md:hidden">Descubra NFTs selecionados de criadores do mundo todo.</span>
        </p>
        <Button asChild className="mt-6 px-4 uppercase max-md:hidden">
          <Link to="/" hash="catalogo">
            Explorar
          </Link>
        </Button>
        <Link
          to="/"
          hash="catalogo"
          className="text-highlight mt-3 inline-flex items-center gap-2 text-xs font-bold uppercase md:hidden"
        >
          Explorar <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="relative justify-self-end md:w-full md:max-w-[450px]">
        {current ? (
          <Link to="/nft/$nftId" params={{ nftId: current.id }} className="block">
            <NftImage
              artwork={current.artwork}
              alt={`Destaque: ${current.name}`}
              sizes="(min-width: 64rem) 450px, (min-width: 48rem) 40vw, 40vw"
              priority
              className="rounded-[18px] md:rounded-[28px]"
            />
          </Link>
        ) : (
          <Skeleton className="aspect-square w-[40vw] rounded-[18px] md:w-full md:rounded-[28px]" />
        )}
        {next && (
          <NftImage
            artwork={next.artwork}
            alt=""
            sizes="70px"
            className="absolute -bottom-2 left-3 w-1/3 rounded-[12px] shadow-lg md:hidden"
          />
        )}
      </div>

      <div className="col-span-full flex justify-center gap-0 md:absolute md:bottom-4 md:left-1/3 md:col-auto">
        {Array.from({ length: items.length || 3 }, (_, dot) => (
          <button
            key={dot}
            type="button"
            onClick={() => setIndex(dot)}
            aria-label={`Mostrar destaque ${dot + 1}`}
            aria-current={dot === index}
            className="group flex size-6 items-center justify-center"
          >
            <span
              className={cn(
                'bg-primary block size-1.5 rounded-full',
                dot !== index && 'opacity-45 group-hover:opacity-80',
              )}
            />
          </button>
        ))}
      </div>
    </section>
  )
}
