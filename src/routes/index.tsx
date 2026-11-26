import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/features/catalog/home-page'
import { catalogSearchSchema } from '@/features/catalog/search-schema'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  component: function IndexRoute() {
    return <HomePage search={Route.useSearch()} />
  },
})
