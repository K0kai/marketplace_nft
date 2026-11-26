import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { ErrorState, Loading } from '@/components/states'
import { Button } from '@/components/ui/button'
import { endSession } from '@/features/session/session-store'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { whenNetworkReady } from '@/lib/network-gate'

type MockState = {
  scenario: string
  scenarios: Record<string, string>
  socketClients: number
  orders: { id: string; status: string }[]
}

// Fala com o "bastidor" do mock por HTTP, igual aos testes. A aplicação em si não sabe disto.
async function control<T>(path: string, body?: unknown): Promise<T> {
  await whenNetworkReady()
  const response = await fetch(`/__mock/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`Controle do mock respondeu ${response.status}`)
  return (response.status === 204 ? undefined : await response.json()) as T
}

const FEATURED = 'emerald-ape-042'

const ACTIONS = [
  { label: 'Mudar preço do Emerald Ape #042', path: `nfts/${FEATURED}`, body: { price: '1.75' } },
  {
    label: 'Esgotar edição 1/50 do Emerald Ape',
    path: `nfts/${FEATURED}`,
    body: { editions: { '1-50': 0 } },
  },
  { label: 'Derrubar a conexão em tempo real', path: 'socket', body: { action: 'disconnect' } },
  { label: 'Manter o tempo real offline', path: 'socket', body: { action: 'offline' } },
  { label: 'Voltar o tempo real', path: 'socket', body: { action: 'online' } },
  { label: 'Expirar a sessão', path: 'session/expire', body: {} },
]

export function DemoPage() {
  useDocumentTitle('Painel da demonstração')
  const client = useQueryClient()
  const [running, setRunning] = useState(false)
  const state = useQuery({
    queryKey: ['mock-control'],
    queryFn: () => control<MockState>('state'),
    retry: false,
    refetchInterval: 3000,
  })

  async function run(action: () => Promise<unknown>, message: string) {
    setRunning(true)
    try {
      await action()
      toast.success(message)
      await state.refetch()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao falar com o mock.')
    } finally {
      setRunning(false)
    }
  }

  async function reset() {
    await control('reset', {})
    endSession('logout')
    client.clear()
    window.localStorage.removeItem('kurio.guest')
    window.sessionStorage.clear()
  }

  if (state.isError) {
    return (
      <div className="page-container py-12">
        <h1 className="mb-4 text-xl font-bold">Painel da demonstração</h1>
        <ErrorState
          error={state.error}
          title="Os mocks não estão ativos neste ambiente"
          onRetry={() => void state.refetch()}
        />
      </div>
    )
  }

  return (
    <div className="page-container py-10">
      <h1 className="text-xl font-bold">Painel da demonstração</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Controla apenas a simulação (MSW). Nada aqui faz parte do produto.
      </p>

      {!state.data ? (
        <Loading label="Carregando o estado do mock" className="mt-6 text-sm">
          Carregando…
        </Loading>
      ) : (
        <>
          <section aria-labelledby="scenario-title" className="mt-8">
            <h2 id="scenario-title" className="font-bold">
              Cenário ativo: <span className="text-highlight">{state.data.scenario}</span>
            </h2>
            <ul className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(state.data.scenarios).map(([name, description]) => (
                <li key={name}>
                  <button
                    type="button"
                    aria-pressed={state.data.scenario === name}
                    disabled={running}
                    onClick={() =>
                      void run(async () => {
                        await control('scenario', { name })
                        await client.resetQueries()
                      }, `Cenário "${name}" ativado.`)
                    }
                    className="bg-card aria-pressed:border-primary h-full w-full border border-transparent p-3 text-left text-xs"
                  >
                    <strong className="block text-sm">{name}</strong>
                    <span className="text-muted-foreground">{description}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="events-title" className="mt-8">
            <h2 id="events-title" className="font-bold">
              Eventos e falhas
            </h2>
            <p className="text-subtle text-xs">
              Os eventos saem do mock pelo protocolo Socket.IO. Conexões ativas:{' '}
              {state.data.socketClients}.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ACTIONS.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  disabled={running}
                  onClick={() =>
                    void run(() => control(action.path, action.body), `${action.label}: feito.`)
                  }
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </section>

          {state.data.orders.some((o) => o.status === 'pending') && (
            <section aria-labelledby="orders-title" className="mt-8">
              <h2 id="orders-title" className="font-bold">
                Pedidos pendentes
              </h2>
              <ul className="mt-2 flex flex-col gap-2">
                {state.data.orders
                  .filter((o) => o.status === 'pending')
                  .map((order) => (
                    <li key={order.id} className="flex flex-wrap items-center gap-2 text-xs">
                      <code>{order.id}</code>
                      {(['confirmed', 'declined'] as const).map((outcome) => (
                        <Button
                          key={outcome}
                          size="sm"
                          disabled={running}
                          onClick={() =>
                            void run(
                              () => control(`orders/${order.id}/settle`, { outcome }),
                              'Pedido liquidado.',
                            )
                          }
                        >
                          {outcome === 'confirmed' ? 'Confirmar' : 'Recusar'}
                        </Button>
                      ))}
                    </li>
                  ))}
              </ul>
            </section>
          )}

          <section className="mt-10">
            <Button
              variant="outline"
              disabled={running}
              onClick={() => void run(reset, 'Mocks restaurados ao estado inicial.')}
            >
              Restaurar tudo
            </Button>
            <p className="text-subtle mt-2 text-xs">
              Contas de teste: nova@kurio.test / Kurio@2026 e leo@kurio.test / Colecionador@1.
            </p>
          </section>
        </>
      )}
    </div>
  )
}
