// A interface renderiza na hora; cada chamada espera a rede (o MSW, na demo) estar pronta.
let gate: () => Promise<unknown> = () => Promise.resolve()

export function setNetworkGate(next: () => Promise<unknown>) {
  gate = next
}

export const whenNetworkReady = () => gate()
