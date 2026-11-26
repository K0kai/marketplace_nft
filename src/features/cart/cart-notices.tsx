import { Info, X } from 'lucide-react'
import { cartNotices, clearCartNotices } from '@/realtime/notices'

/** Registro das mudanças que chegaram ao vivo; fica na tela até ser dispensado. */
export function CartNotices() {
  const notices = cartNotices.use()
  if (notices.length === 0) return null
  return (
    <div
      role="status"
      className="border-primary bg-band mb-4 flex items-start gap-3 border p-3 text-xs"
    >
      <Info className="text-highlight mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        <p className="font-bold">Seu carrinho mudou</p>
        <ul className="mt-1 flex flex-col gap-1">
          {notices.map((notice) => (
            <li key={notice.id}>{notice.message}</li>
          ))}
        </ul>
      </div>
      <button type="button" onClick={clearCartNotices} aria-label="Dispensar aviso">
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
