// A interface renderiza na hora; requisições e socket esperam a rede (o MSW, na demo) ficar pronta.
let ready: Promise<unknown> = Promise.resolve()

export function setNetworkReady(promise: Promise<unknown>) {
  ready = promise
}

export const whenNetworkReady = () => ready
