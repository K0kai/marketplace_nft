import { createFileRoute } from '@tanstack/react-router'
import { OrderPage } from '@/features/orders/order-page'

export const Route = createFileRoute('/_auth/orders/$orderId')({
  staticData: { chrome: 'bare' },
  component: function OrderRoute() {
    return <OrderPage orderId={Route.useParams().orderId} />
  },
})
