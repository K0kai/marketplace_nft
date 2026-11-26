import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { editionIdSchema } from '@/api/contracts'
import { NftDetailPage } from '@/features/nft/detail-page'

export const Route = createFileRoute('/nft/$nftId')({
  validateSearch: z.object({ edition: editionIdSchema.optional().catch(undefined) }),
  staticData: { chrome: 'mobile-immersive' },
  component: function NftRoute() {
    const { nftId } = Route.useParams()
    return <NftDetailPage nftId={nftId} edition={Route.useSearch().edition} />
  },
})
