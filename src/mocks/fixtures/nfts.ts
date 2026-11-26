import type { Artwork, Category, Edition, NftDetail, Network } from '../../api/contracts/index.ts'
import { createRandom } from './random.ts'

export type NftRecord = NftDetail & { trendingScore: number }

/** Data de referência dos fixtures (a mesma usada no layout). */
export const FIXTURE_NOW = Date.parse('2026-07-29T12:00:00.000Z')

const HOUR = 3_600_000
const DAY = 24 * HOUR

const defaultEditions = (overrides: Partial<Record<Edition['id'], number>> = {}): Edition[] => [
  { id: '1-1', available: overrides['1-1'] ?? 1, maxPerOrder: 1 },
  { id: '1-10', available: overrides['1-10'] ?? 6, maxPerOrder: 3 },
  { id: '1-50', available: overrides['1-50'] ?? 30, maxPerOrder: 10 },
  { id: 'open', available: overrides.open ?? 500, maxPerOrder: 20 },
]

type Seed = {
  name: string
  number: string
  artwork: Artwork
  price: string
  previousPrice?: string
  rare?: boolean
  category: Category
  network: Network
  editions?: Edition[]
  trending: number
  attributes?: string[]
}

// Os nove primeiros reproduzem a grade do layout, na mesma ordem.
const showcase: Seed[] = [
  {
    name: 'Emerald Ape',
    number: '042',
    artwork: 'emerald',
    price: '1.19',
    category: 'digital-art',
    network: 'ethereum',
    editions: defaultEditions({ '1-1': 0, '1-50': 22 }),
    trending: 95,
    attributes: ['Óculos', 'Esmeralda', 'Raro'],
  },
  {
    name: 'Sage Nomad',
    number: '009',
    artwork: 'sage',
    price: '1.69',
    category: 'digital-art',
    network: 'ethereum',
    trending: 80,
  },
  {
    name: 'Neon Vessel',
    number: '552',
    artwork: 'ivory',
    price: '1.99',
    previousPrice: '2.29',
    rare: true,
    category: '3d-art',
    network: 'polygon',
    trending: 88,
  },
  {
    name: 'Cosmic Bloom',
    number: '118',
    artwork: 'sage',
    price: '1.29',
    category: 'generative',
    network: 'ethereum',
    trending: 40,
  },
  {
    name: 'Violet Nomad',
    number: '314',
    artwork: 'sage',
    price: '1.39',
    category: 'collectibles',
    network: 'ethereum',
    trending: 91,
  },
  {
    name: 'Ivory Baron',
    number: '088',
    artwork: 'ivory',
    price: '1.79',
    category: 'digital-art',
    network: 'ethereum',
    editions: defaultEditions({ '1-50': 15 }),
    trending: 77,
  },
  {
    name: 'Golden Beat',
    number: '207',
    artwork: 'golden',
    price: '0.99',
    category: 'music',
    network: 'solana',
    trending: 72,
  },
  {
    name: 'Golden Frequency',
    number: '071',
    artwork: 'golden',
    price: '0.59',
    category: 'music',
    network: 'polygon',
    trending: 30,
  },
  {
    name: 'Golden Signal',
    number: '160',
    artwork: 'golden',
    price: '0.39',
    category: 'utility',
    network: 'solana',
    trending: 20,
  },
]

const PREFIXES = [
  'Amber',
  'Jade',
  'Crimson',
  'Lunar',
  'Solar',
  'Velvet',
  'Cobalt',
  'Onyx',
  'Pearl',
  'Copper',
  'Indigo',
  'Mossy',
  'Ruby',
  'Silver',
  'Quartz',
  'Saffron',
  'Nova',
]
const SUFFIXES = [
  'Drifter',
  'Oracle',
  'Rider',
  'Voyager',
  'Scholar',
  'Maestro',
  'Pilot',
  'Keeper',
  'Rebel',
  'Dreamer',
  'Cipher',
]
const CATEGORIES: Category[] = [
  'digital-art',
  'photography',
  'music',
  '3d-art',
  'collectibles',
  'generative',
  'games',
  'subscriptions',
  'utility',
]
const NETWORKS: Network[] = ['ethereum', 'ethereum', 'polygon', 'solana']
const ARTWORKS: Artwork[] = ['emerald', 'sage', 'ivory', 'golden']

function generated(count: number): Seed[] {
  const random = createRandom(2026)
  return Array.from({ length: count }, (_, index) => {
    const cents = 2 + Math.floor(random() * 480)
    const price = (cents / 100).toFixed(2)
    const seed: Seed = {
      name: `${PREFIXES[index % PREFIXES.length]} ${SUFFIXES[(index * 3) % SUFFIXES.length]}`,
      number: String(600 + index),
      artwork: ARTWORKS[(index + 1) % ARTWORKS.length]!,
      price,
      category: CATEGORIES[index % CATEGORIES.length]!,
      network: NETWORKS[Math.floor(random() * NETWORKS.length)]!,
      trending: Math.floor(random() * 100),
      rare: index % 11 === 4,
    }
    // casos de borda para os filtros e para o detalhe
    if (index === 0) seed.price = '0.02'
    if (index === 1) seed.price = '12.3'
    if (index === 2) seed.editions = defaultEditions({ '1-1': 0, '1-10': 0, '1-50': 0, open: 0 })
    if (index === 3) seed.editions = defaultEditions({ '1-1': 0, '1-10': 1, '1-50': 2, open: 3 })
    return seed
  })
}

const REVIEWS = [
  { author: 'Marina C.', rating: 5, comment: 'Acabamento impecável e metadados completos.' },
  { author: 'Davi R.', rating: 5, comment: 'A procedência está toda registrada, recomendo.' },
  { author: 'Júlia P.', rating: 4, comment: 'Arte linda; a versão em alta resolução vale muito.' },
]

function toRecord(seed: Seed, index: number): NftRecord {
  const slug = `${seed.name.toLowerCase().replace(/\s+/g, '-')}-${seed.number}`
  const title = `${seed.name} #${seed.number}`
  const listedAt =
    index < showcase.length
      ? FIXTURE_NOW - (index + 1) * HOUR
      : FIXTURE_NOW - (index - showcase.length + 1) * DAY

  return {
    id: slug,
    name: title,
    tokenId: seed.number.padStart(4, '0'),
    artwork: seed.artwork,
    price: seed.price,
    previousPrice: seed.previousPrice ?? null,
    rare: seed.rare ?? false,
    category: seed.category,
    network: seed.network,
    listedAt: new Date(listedAt).toISOString(),
    editions: seed.editions ?? defaultEditions(),
    version: 1,
    trendingScore: seed.trending,
    summary:
      'Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na rede, com arte desbloqueável e acesso para colecionadores.',
    description: [
      `${title} é uma obra digital finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na rede. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      'A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.',
    ],
    collection: 'Kurio Apes',
    creator: 'Nova Sato',
    attributes: seed.attributes ?? ['Retrato', 'Kurio', seed.rare ? 'Raro' : 'Clássico'],
    gallery: [seed.artwork, seed.artwork, seed.artwork, seed.artwork],
    rating: 4.8,
    reviewsCount: 19,
    reviews: REVIEWS.map((review, i) => ({ id: `${slug}-review-${i}`, ...review })),
    contractAddress: '0x7A42...19E8',
    royaltyPercent: 5,
  }
}

export function createNftFixtures(): NftRecord[] {
  return [...showcase, ...generated(51)].map(toRecord)
}
