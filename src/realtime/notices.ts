import { createStore } from '@/lib/store'

export type CartNotice = { id: string; nftId: string; message: string }

/** Mudanças em itens do carrinho, mostradas até o usuário dispensar. */
export const cartNotices = createStore<CartNotice[]>([])

export function pushCartNotice(notice: CartNotice) {
  const others = cartNotices.get().filter((n) => n.nftId !== notice.nftId)
  cartNotices.set([...others, notice])
}

export function clearCartNotices() {
  cartNotices.set([])
}

export type ConnectionStatus = 'idle' | 'online' | 'reconnecting'
export const connectionStatus = createStore<ConnectionStatus>('idle')
