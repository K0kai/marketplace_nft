import { http, HttpResponse } from 'msw'
import {
  addCartItemSchema,
  couponInputSchema,
  quoteInputSchema,
  updateCartItemSchema,
} from '../../api/contracts/index.ts'
import {
  addLine,
  applyCoupon,
  buildCart,
  buildQuote,
  removeCoupon,
  removeLine,
  updateLine,
} from '../domain/cart.ts'
import { cartOwner, readBody } from '../http.ts'

export const cartHandlers = [
  http.get('*/api/cart', ({ request }) => HttpResponse.json(buildCart(cartOwner(request)))),

  http.post('*/api/cart/items', async ({ request }) => {
    const owner = cartOwner(request)
    const { nftId, editionId, quantity } = await readBody(request, addCartItemSchema)
    addLine(owner, nftId, editionId, quantity)
    return HttpResponse.json(buildCart(owner), { status: 201 })
  }),

  http.patch('*/api/cart/items/:itemId', async ({ request, params }) => {
    const owner = cartOwner(request)
    const { quantity } = await readBody(request, updateCartItemSchema)
    updateLine(owner, String(params.itemId), quantity)
    return HttpResponse.json(buildCart(owner))
  }),

  http.delete('*/api/cart/items/:itemId', ({ request, params }) => {
    const owner = cartOwner(request)
    removeLine(owner, String(params.itemId))
    return HttpResponse.json(buildCart(owner))
  }),

  http.put('*/api/cart/coupon', async ({ request }) => {
    const owner = cartOwner(request)
    const { code } = await readBody(request, couponInputSchema)
    applyCoupon(owner, code)
    return HttpResponse.json(buildCart(owner))
  }),

  http.delete('*/api/cart/coupon', ({ request }) => {
    const owner = cartOwner(request)
    removeCoupon(owner)
    return HttpResponse.json(buildCart(owner))
  }),

  http.post('*/api/quotes', async ({ request }) => {
    const owner = cartOwner(request)
    const { network } = await readBody(request, quoteInputSchema)
    return HttpResponse.json(buildQuote(owner, network))
  }),
]
