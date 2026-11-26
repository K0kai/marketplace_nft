import { createFileRoute } from '@tanstack/react-router'
import { CartPage } from '@/features/cart/cart-page'

export const Route = createFileRoute('/cart')({
  staticData: { chrome: 'mobile-immersive' },
  component: CartPage,
})
