import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/use-document-title'

// Páginas fora do escopo do desafio: dizem isso claramente em vez de simular conteúdo.
export const Route = createFileRoute('/em-breve')({
  validateSearch: z.object({ area: z.string().max(40).optional().catch(undefined) }),
  component: function SoonPage() {
    const { area = 'Esta área' } = Route.useSearch()
    useDocumentTitle('Em breve')
    return (
      <div className="page-container flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-2xl font-bold">{area}: em breve</h1>
        <p className="text-muted-foreground max-w-md text-sm">
          Esta página não faz parte desta demonstração.
        </p>
        <Button asChild>
          <Link to="/">Voltar ao mercado</Link>
        </Button>
      </div>
    )
  },
})
