import { ZoomIn } from 'lucide-react'
import { useState } from 'react'
import type { NftDetail } from '@/api/contracts'
import { NftImage } from '@/components/nft-image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// só temos uma arte por NFT; os enquadramentos fazem o papel das outras vistas
const FRAMINGS = [
  { className: '', label: 'obra completa' },
  { className: 'scale-[1.35] origin-top', label: 'detalhe do rosto' },
  { className: 'scale-[1.6] origin-bottom', label: 'detalhe da roupa' },
  { className: '-scale-x-100', label: 'versão espelhada' },
]

export function Gallery({ nft }: { nft: NftDetail }) {
  const [index, setIndex] = useState(0)
  const framing = FRAMINGS[index] ?? FRAMINGS[0]!
  const artwork = nft.gallery[index] ?? nft.artwork
  const alt = `${nft.name}, ${framing.label}`

  return (
    <div className="flex gap-6 max-md:flex-col-reverse max-md:gap-3">
      <ul className="flex gap-3.5 max-md:justify-center md:flex-col">
        {nft.gallery.map((thumb, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-pressed={i === index}
              aria-label={`Ver ${FRAMINGS[i]?.label ?? `imagem ${i + 1}`}`}
              className={cn(
                'block size-14 overflow-hidden rounded-[6px] border-2 border-transparent md:size-[90px]',
                i === index && 'border-primary',
              )}
            >
              <NftImage artwork={thumb} alt="" sizes="90px" className={FRAMINGS[i]?.className} />
            </button>
          </li>
        ))}
      </ul>

      <div className="bg-card relative min-w-0 flex-1 p-0 md:p-[18px]">
        <div className="overflow-hidden rounded-[22px]">
          <NftImage
            artwork={artwork}
            alt={alt}
            sizes="(min-width: 64rem) 380px, (min-width: 48rem) 40vw, 90vw"
            priority
            className={framing.className}
          />
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Ampliar imagem"
              className="bg-background/80 hover:text-highlight absolute top-3 right-3 flex size-9 items-center justify-center rounded-full max-md:hidden"
            >
              <ZoomIn className="size-5" aria-hidden="true" />
            </button>
          </DialogTrigger>
          <DialogContent className="bg-card p-4 sm:max-w-[640px]">
            <DialogTitle>{nft.name}</DialogTitle>
            <DialogDescription>Imagem ampliada: {framing.label}.</DialogDescription>
            <div className="overflow-hidden rounded-[18px]">
              <NftImage artwork={artwork} alt={alt} sizes="600px" className={framing.className} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
