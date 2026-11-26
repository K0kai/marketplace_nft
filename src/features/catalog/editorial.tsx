import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { Artwork } from '@/api/contracts'
import { NftImage } from '@/components/nft-image'
import { Button } from '@/components/ui/button'

const BANNERS: { artwork: Artwork; title: string; text: string }[] = [
  {
    artwork: 'emerald',
    title: 'Lançamentos gênesis de edição limitada',
    text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
  },
  {
    artwork: 'ivory',
    title: 'Arte digital selecionada e muito mais',
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
  },
]

const POSTS: { artwork: Artwork; meta: string; title: string; text: string }[] = [
  {
    artwork: 'ivory',
    meta: '12 de setembro | Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    text: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
  },
  {
    artwork: 'emerald',
    meta: '13 de setembro | Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    text: 'Conheça criadores que moldam a cultura digital.',
  },
  {
    artwork: 'sage',
    meta: '15 de setembro | Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    text: 'Entenda raridade, procedência, direitos autorais e utilidade.',
  },
  {
    artwork: 'golden',
    meta: '15 de setembro | Leitura de 2 min',
    title: 'Como proteger sua carteira',
    text: 'Proteja sua carteira, seus ativos e sua identidade.',
  },
]

export function Editorial() {
  return (
    <div className="max-md:hidden">
      <div className="mt-16 grid gap-4 lg:grid-cols-2">
        {BANNERS.map((banner) => (
          <section key={banner.title} className="bg-card flex items-center gap-4">
            <NftImage
              artwork={banner.artwork}
              alt=""
              sizes="200px"
              className="w-[200px] shrink-0 rounded-[18px]"
            />
            <div className="flex-1 pr-5 text-right">
              <h2 className="text-sm font-bold">{banner.title}</h2>
              <p className="text-muted-foreground mt-2 text-xs leading-5">{banner.text}</p>
              <Button asChild size="sm" className="mt-3">
                <Link
                  to="/"
                  search={{ tab: 'new' }}
                  hash="catalogo"
                  aria-label={`Explorar: ${banner.title}`}
                >
                  Explorar <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </section>
        ))}
      </div>

      <section className="mt-16">
        <h2 className="text-center text-lg font-bold">Diário da Cunhagem</h2>
        <p className="text-muted-foreground mt-2 text-center text-xs">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
        <ul className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {POSTS.map((post) => (
            <li key={post.title} className="bg-card overflow-hidden rounded-[8px]">
              <NftImage artwork={post.artwork} alt="" sizes="270px" className="aspect-[4/3]" />
              <div className="p-3">
                <p className="text-subtle text-[10px]">{post.meta}</p>
                <h3 className="mt-2 text-sm font-bold">{post.title}</h3>
                <p className="text-muted-foreground mt-2 text-[11px] leading-4">{post.text}</p>
                <Link
                  to="/em-breve"
                  search={{ area: 'Diário da Cunhagem' }}
                  className="text-highlight mt-2 inline-block text-[11px] font-bold"
                  aria-label={`Ler mais: ${post.title}`}
                >
                  Ler mais →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
