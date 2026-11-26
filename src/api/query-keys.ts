import type { CatalogParams, Network } from './contracts'

// Tudo que é privado fica sob ['user', userId]: trocar de usuário é remover essa raiz.
export const queryKeys = {
  nfts: ['nfts'] as const,
  nftLists: ['nfts', 'list'] as const,
  nftList: (params: CatalogParams) => ['nfts', 'list', params] as const,
  nftDetail: (id: string) => ['nfts', 'detail', id] as const,
  nftRelated: (id: string) => ['nfts', 'related', id] as const,
  highlights: ['nfts', 'highlights'] as const,

  user: (userId: string) => ['user', userId] as const,
  profile: (userId: string) => ['user', userId, 'profile'] as const,
  favorites: (userId: string) => ['user', userId, 'favorites'] as const,
  wallets: (userId: string) => ['user', userId, 'wallets'] as const,
  orders: (userId: string) => ['user', userId, 'orders'] as const,
  pendingOrders: (userId: string) => ['user', userId, 'orders', 'pending'] as const,
  order: (userId: string, id: string) => ['user', userId, 'orders', id] as const,

  cart: (userId: string | null) =>
    userId ? (['user', userId, 'cart'] as const) : (['guest', 'cart'] as const),
  // a cotação fica "dentro" do carrinho: invalidar o carrinho invalida a cotação
  quote: (userId: string | null, network: Network) =>
    [...queryKeys.cart(userId), 'quote', network] as const,
}
