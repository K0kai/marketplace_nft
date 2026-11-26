import { Link } from '@tanstack/react-router'
import type { FormEvent, ReactNode } from 'react'
import { toast } from 'sonner'
import { CATEGORY_LABELS, type Category } from '@/api/contracts'
import { FacebookIcon, InstagramIcon, LinkedinIcon, TwitterIcon, YoutubeIcon } from './social-icons'

const HIGHLIGHTS = [
  [
    'W',
    'Segurança da carteira',
    'Proteja sua carteira e colecione arte digital verificada com confiança.',
  ],
  [
    'C',
    'Criadores em destaque',
    'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  ],
  [
    'D',
    'Alertas de lançamentos',
    'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  ],
] as const

const FOOTER_CATEGORIES: Category[] = ['digital-art', 'photography', 'music', '3d-art', 'utility']

const SOCIAL = [
  ['Facebook', 'https://www.facebook.com', FacebookIcon],
  ['Instagram', 'https://www.instagram.com', InstagramIcon],
  ['X (Twitter)', 'https://x.com', TwitterIcon],
  ['LinkedIn', 'https://www.linkedin.com', LinkedinIcon],
  ['YouTube', 'https://www.youtube.com', YoutubeIcon],
] as const

function SoonLink({ area }: { area: string }) {
  return (
    <Link to="/em-breve" search={{ area }} className="hover:text-highlight">
      {area}
    </Link>
  )
}

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-bold">{title}</h2>
      <ul className="flex flex-col gap-2 text-xs">{children}</ul>
    </div>
  )
}

export function WalletBadges() {
  return (
    <p className="bg-band text-highlight inline-block rounded-[4px] px-3 py-1.5 text-[10px] font-bold">
      METAMASK · WALLETCONNECT · COINBASE
    </p>
  )
}

export function Footer() {
  function subscribe(event: FormEvent) {
    event.preventDefault()
    // fora do escopo: avisa em vez de fingir que inscreveu
    toast.info('A newsletter não está disponível nesta demonstração.')
  }

  return (
    <footer className="page-container mt-24 pb-4 max-md:hidden">
      <div className="bg-card">
        <div className="grid grid-cols-2 gap-6 p-6 lg:grid-cols-[repeat(3,1fr)_1.3fr] lg:gap-0">
          {HIGHLIGHTS.map(([letter, title, text]) => (
            <section key={title} className="border-line-strong lg:border-r lg:px-3">
              <span
                aria-hidden="true"
                className="bg-primary text-primary-foreground flex size-[72px] items-center justify-center rounded-full text-xl font-bold"
              >
                {letter}
              </span>
              <h2 className="mt-3 text-sm font-bold">{title}</h2>
              <p className="text-muted-foreground mt-2 text-xs leading-5">{text}</p>
            </section>
          ))}
          <section className="lg:px-4">
            <h2 className="text-sm font-bold">Antecipe-se ao próximo lançamento</h2>
            <form onSubmit={subscribe} className="mt-3 flex">
              <input
                type="email"
                required
                aria-label="Seu e-mail"
                placeholder="digite seu e-mail..."
                className="bg-band placeholder:text-subtle min-w-0 flex-1 rounded-l-[4px] px-3 text-xs"
              />
              <button
                type="submit"
                className="bg-primary text-primary-foreground h-10 rounded-r-[4px] px-3 text-sm font-bold"
              >
                Enviar
              </button>
            </form>
            <p className="text-muted-foreground mt-3 text-[11px] leading-5">
              Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
            </p>
          </section>
        </div>
        <div className="bg-band grid grid-cols-2 items-center gap-3 px-8 py-4 text-xs lg:grid-cols-4">
          <span className="font-bold tracking-[0.18em]">KURIO</span>
          <span>Feito para colecionadores, criadores e cultura</span>
          <a href="mailto:contato@email.com">contato@email.com</a>
          <a href="tel:+551140028922">+55 11 4002 8922</a>
        </div>
        <div className="grid grid-cols-2 gap-6 px-8 py-7 lg:grid-cols-4">
          <Column title="Meu perfil">
            <li>
              <Link to="/profile" className="hover:text-highlight">
                Meu perfil
              </Link>
            </li>
            <li>
              <SoonLink area="Minha coleção" />
            </li>
            <li>
              <SoonLink area="Atividade" />
            </li>
            <li>
              <SoonLink area="Estúdio do criador" />
            </li>
            <li>
              <Link to="/profile/favorites" className="hover:text-highlight">
                Lista de interesse
              </Link>
            </li>
          </Column>
          <Column title="Central de ajuda">
            {[
              'Central de ajuda',
              'Como comprar NFTs',
              'Carteira e segurança',
              'Política do mercado',
              'Denunciar item',
            ].map((area) => (
              <li key={area}>
                <SoonLink area={area} />
              </li>
            ))}
          </Column>
          <Column title="Coleções">
            {FOOTER_CATEGORIES.map((category) => (
              <li key={category}>
                <Link to="/" search={{ category }} className="hover:text-highlight">
                  {CATEGORY_LABELS[category]}
                </Link>
              </li>
            ))}
          </Column>
          <div>
            <h2 className="mb-3 text-sm font-bold">Redes sociais</h2>
            <ul className="flex gap-2">
              {SOCIAL.map(([name, href, Icon]) => (
                <li key={name}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`${name} (abre em nova aba)`}
                    className="border-primary text-primary hover:bg-secondary flex size-8 items-center justify-center rounded-[4px] border"
                  >
                    <Icon className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
            <h2 className="mt-5 mb-2 text-sm font-bold">Carteiras compatíveis</h2>
            <WalletBadges />
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  )
}
