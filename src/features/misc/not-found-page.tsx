import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/use-document-title'

export function NotFoundPage() {
  useDocumentTitle('Página não encontrada')
  return (
    <div className="page-container flex flex-col items-center gap-4 py-24 text-center">
      <p aria-hidden="true" className="text-highlight text-6xl font-bold">
        404
      </p>
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        O endereço pode estar errado ou a página não existe mais.
      </p>
      <Button asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </div>
  )
}
