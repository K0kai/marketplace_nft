import {
  cartSchema,
  catalogResponseSchema,
  favoritesSchema,
  highlightsResponseSchema,
  nftDetailSchema,
  nftListSchema,
  orderListSchema,
  orderSchema,
  profileSchema,
  quoteSchema,
  sessionSchema,
  walletConnectionSchema,
  walletListSchema,
  walletSchema,
  type AddCartItemInput,
  type CatalogParams,
  type CreateOrderInput,
  type LoginInput,
  type Network,
  type PasswordInput,
  type ProfileInput,
  type RegisterInput,
  type WalletConnectionInput,
  type WalletInput,
} from './contracts'
import { http, request } from './http'

type Signal = { signal?: AbortSignal }
const path = (value: string) => encodeURIComponent(value)

export const authApi = {
  login: (data: LoginInput) => request(sessionSchema, { method: 'post', url: '/auth/login', data }),
  register: (data: RegisterInput) =>
    request(sessionSchema, { method: 'post', url: '/auth/register', data }),
  session: ({ signal }: Signal = {}) => request(sessionSchema, { url: '/auth/session', signal }),
  logout: () => http.post('/auth/logout'),
}

export const nftApi = {
  list: (params: CatalogParams, { signal }: Signal = {}) =>
    request(catalogResponseSchema, { url: '/nfts', params, signal }),
  highlights: ({ signal }: Signal = {}) =>
    request(highlightsResponseSchema, { url: '/nfts/highlights', signal }),
  detail: (id: string, { signal }: Signal = {}) =>
    request(nftDetailSchema, { url: `/nfts/${path(id)}`, signal }),
  related: (id: string, { signal }: Signal = {}) =>
    request(nftListSchema, { url: `/nfts/${path(id)}/related`, signal }),
}

export const favoriteApi = {
  list: ({ signal }: Signal = {}) => request(favoritesSchema, { url: '/favorites', signal }),
  set: (id: string, favorite: boolean) =>
    request(favoritesSchema, {
      method: favorite ? 'put' : 'delete',
      url: `/favorites/${path(id)}`,
    }),
}

export const cartApi = {
  get: ({ signal }: Signal = {}) => request(cartSchema, { url: '/cart', signal }),
  add: (data: AddCartItemInput) =>
    request(cartSchema, { method: 'post', url: '/cart/items', data }),
  update: (itemId: string, quantity: number) =>
    request(cartSchema, {
      method: 'patch',
      url: `/cart/items/${path(itemId)}`,
      data: { quantity },
    }),
  remove: (itemId: string) =>
    request(cartSchema, { method: 'delete', url: `/cart/items/${path(itemId)}` }),
  applyCoupon: (code: string) =>
    request(cartSchema, { method: 'put', url: '/cart/coupon', data: { code } }),
  removeCoupon: () => request(cartSchema, { method: 'delete', url: '/cart/coupon' }),
  quote: (network: Network, { signal }: Signal = {}) =>
    request(quoteSchema, { method: 'post', url: '/quotes', data: { network }, signal }),
}

export const orderApi = {
  create: (data: CreateOrderInput, idempotencyKey: string) =>
    request(orderSchema, {
      method: 'post',
      url: '/orders',
      data,
      headers: { 'Idempotency-Key': idempotencyKey },
    }),
  get: (id: string, { signal }: Signal = {}) =>
    request(orderSchema, { url: `/orders/${path(id)}`, signal }),
  listPending: ({ signal }: Signal = {}) =>
    request(orderListSchema, { url: '/orders', params: { status: 'pending' }, signal }),
}

export const accountApi = {
  profile: ({ signal }: Signal = {}) => request(profileSchema, { url: '/profile', signal }),
  updateProfile: (data: ProfileInput) =>
    request(profileSchema, { method: 'patch', url: '/profile', data }),
  setAvatar: (dataUrl: string) =>
    request(profileSchema, { method: 'put', url: '/profile/avatar', data: { dataUrl } }),
  removeAvatar: () => request(profileSchema, { method: 'delete', url: '/profile/avatar' }),
  changePassword: (data: PasswordInput) => http.put('/profile/password', data),
  wallets: ({ signal }: Signal = {}) => request(walletListSchema, { url: '/wallets', signal }),
  createWallet: (data: WalletInput) =>
    request(walletSchema, { method: 'post', url: '/wallets', data }),
  updateWallet: (id: string, data: WalletInput) =>
    request(walletSchema, { method: 'put', url: `/wallets/${path(id)}`, data }),
  connectWallet: (data: WalletConnectionInput) =>
    request(walletConnectionSchema, { method: 'post', url: '/wallet-connections', data }),
  disconnectWallet: (id: string) => http.delete(`/wallet-connections/${path(id)}`),
}
