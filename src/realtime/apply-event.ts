import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  EDITION_LABELS,
  type Cart,
  type NftSummary,
  type NftUpdatedEvent,
  type Order,
  type OrderUpdatedEvent,
} from '@/api/contracts'
import { queryKeys } from '@/api/query-keys'
import { formatEth } from '@/lib/eth'
import { pushCartNotice } from './notices'

type Patchable = Pick<NftSummary, 'id' | 'version' | 'price' | 'previousPrice' | 'editions'>

function isPatchable(value: unknown): value is Patchable {
  return typeof value === 'object' && value !== null && 'version' in value && 'editions' in value
}

/**
 * Atualiza o NFT onde quer que ele apareça no cache (detalhe, listas, destaques, favoritos).
 * Só aplica sobre versões mais antigas: o que veio do REST mais novo não regride.
 */
function patchDeep(data: unknown, event: NftUpdatedEvent): unknown {
  if (Array.isArray(data)) {
    const next = data.map((item) => patchDeep(item, event))
    return next.some((item, i) => item !== data[i]) ? next : data
  }
  if (typeof data !== 'object' || data === null) return data
  if (isPatchable(data)) {
    if (data.id !== event.resource.id || data.version >= event.version) return data
    return { ...data, ...event.payload, version: event.version }
  }
  let changed = false
  const entries = Object.entries(data).map(([key, value]) => {
    const next = patchDeep(value, event)
    changed ||= next !== value
    return [key, next]
  })
  return changed ? Object.fromEntries(entries) : data
}

function describeCartChange(cart: Cart, event: NftUpdatedEvent): string | null {
  const messages: string[] = []
  // o filtro do socket zera no refresh; a versão do próprio carrinho continua valendo
  const outdated = cart.items.filter(
    (i) => i.nftId === event.resource.id && i.nftVersion < event.version,
  )
  for (const item of outdated) {
    const edition = event.payload.editions.find((e) => e.id === item.editionId)
    if (item.unitPrice !== event.payload.price) {
      messages.push(
        `O preço de ${item.name} mudou de ${formatEth(item.unitPrice)} para ${formatEth(event.payload.price)} ETH.`,
      )
    }
    if (edition && edition.available !== item.available) {
      const label = `${item.name} (edição ${EDITION_LABELS[item.editionId]})`
      if (edition.available === 0) messages.push(`${label} esgotou.`)
      else if (edition.available < item.quantity) {
        messages.push(`${label} agora tem só ${edition.available} unidade(s).`)
      }
    }
  }
  return messages.length > 0 ? [...new Set(messages)].join(' ') : null
}

export function applyNftUpdate(client: QueryClient, userId: string | null, event: NftUpdatedEvent) {
  const patch = (data: unknown) => patchDeep(data, event)
  client.setQueriesData({ queryKey: queryKeys.nfts }, patch)
  if (userId) client.setQueriesData({ queryKey: queryKeys.favorites(userId) }, patch)

  // preço novo pode mudar quem passa no filtro e a ordenação: o REST decide
  void client.invalidateQueries({ queryKey: queryKeys.nftLists })

  const cartKey = queryKeys.cart(userId)
  const cart = client.getQueryData<Cart>(cartKey)
  if (cart?.items.some((item) => item.nftId === event.resource.id)) {
    const message = describeCartChange(cart, event)
    if (message) {
      pushCartNotice({ id: event.eventId, nftId: event.resource.id, message })
      toast.warning(message, { id: `nft-${event.resource.id}` })
    }
    void client.invalidateQueries({ queryKey: cartKey })
  }
}

export function applyOrderUpdate(client: QueryClient, userId: string, event: OrderUpdatedEvent) {
  const key = queryKeys.order(userId, event.resource.id)
  const current = client.getQueryData<Order>(key)
  if (current && current.version < event.version && current.status === 'pending') {
    client.setQueryData<Order>(key, { ...current, ...event.payload, version: event.version })
  }
  void client.invalidateQueries({ queryKey: queryKeys.orders(userId) })
  void client.invalidateQueries({ queryKey: queryKeys.cart(userId) })

  // a tela já mostrava este estado: não há o que anunciar de novo
  if (current && current.version >= event.version) return
  if (event.payload.status === 'confirmed') {
    toast.success('Pagamento confirmado!', { id: event.resource.id })
  } else if (event.payload.status === 'declined') {
    toast.error('Pagamento recusado.', { id: event.resource.id })
  }
}
