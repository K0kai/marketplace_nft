import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/use-document-title'

export const Route = createFileRoute('/explorer/$hash')({
  component: function SimulatedExplorer() {
    const { hash } = Route.useParams()
    useDocumentTitle('Explorador simulado')
    return (
      <div className="page-container py-16">
        <div className="bg-card mx-auto max-w-xl p-8">
          <p className="text-highlight text-xs font-bold">EXPLORADOR SIMULADO</p>
          <h1 className="mt-2 text-lg font-bold">Transação fictícia</h1>
          <p className="text-muted-foreground mt-3 text-xs break-all">{hash}</p>
          <p className="mt-4 text-sm">
            Nenhuma blockchain real foi acessada. Esta referência existe apenas na simulação.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    )
  },
})
