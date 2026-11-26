import { useRouter } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export function SearchDialog({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = String(new FormData(event.currentTarget).get('q') ?? '').trim()
    setOpen(false)
    // na home mantém os outros filtros; a busca nova volta para a página 1
    const keep = router.state.location.pathname === '/' ? router.state.location.search : {}
    void router.navigate({ to: '/', search: { ...keep, q: q || undefined, page: undefined } })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-card top-24 translate-y-0">
        <DialogTitle>Buscar NFTs</DialogTitle>
        <DialogDescription>Procure por nome, número do token ou coleção.</DialogDescription>
        <form onSubmit={submit} role="search" className="flex gap-2">
          <Input
            name="q"
            type="search"
            aria-label="Termo de busca"
            placeholder="Ex.: Emerald Ape"
          />
          <Button type="submit" className="h-12">
            <Search aria-hidden="true" />
            Buscar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
