import type { Artwork } from '@/api/contracts'
import { cn } from '@/lib/utils'

const WIDTHS = [160, 320, 640]

type Props = {
  artwork: Artwork
  alt: string
  // largura em que a imagem é exibida, para o navegador escolher o arquivo certo
  sizes: string
  priority?: boolean
  className?: string
}

export function NftImage({ artwork, alt, sizes, priority = false, className }: Props) {
  return (
    <img
      src={`/nfts/${artwork}-640.webp`}
      srcSet={WIDTHS.map((width) => `/nfts/${artwork}-${width}.webp ${width}w`).join(', ')}
      sizes={sizes}
      alt={alt}
      width={640}
      height={640}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={cn('aspect-square w-full object-cover', className)}
    />
  )
}
