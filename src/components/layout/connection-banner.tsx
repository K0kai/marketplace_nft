import { WifiOff } from 'lucide-react'
import { connectionStatus } from '@/realtime/notices'

export function ConnectionBanner() {
  const status = connectionStatus.use()
  // o contêiner fica sempre no DOM para o leitor de tela perceber a mudança
  return (
    <div role="status" className="fixed top-2 left-1/2 z-50 -translate-x-1/2">
      {status === 'reconnecting' && (
        <p className="bg-card border-line-strong flex items-center gap-2 border px-3 py-2 text-xs whitespace-nowrap shadow-lg">
          <WifiOff className="text-highlight size-4" aria-hidden="true" />
          Reconectando atualizações ao vivo…
        </p>
      )}
    </div>
  )
}
