/**
 * Cenários nomeados. Cada um é determinístico: mesma sequência de ações, mesmo resultado.
 * Selecione com ?scenario=<nome> na URL, pela página /demo ou por POST /__mock/scenario.
 */
export const SCENARIOS = {
  default: 'Tudo funcionando, com latência baixa e fixa.',
  'empty-catalog': 'Catálogo sempre vazio.',
  slow: 'Latência fixa de 2,5 s em todas as respostas (bom para ver os skeletons).',
  'variable-latency': 'Latência entre 100 ms e 1,6 s, sorteada com seed fixa.',
  'out-of-order': 'Buscas no catálogo alternam entre lentas e rápidas, chegando fora de ordem.',
  offline: 'Todas as requisições falham como se não houvesse conexão.',
  'server-error': 'Consultas respondem 500.',
  'catalog-error': 'Somente o catálogo responde 503.',
  flaky: 'A primeira chamada de cada consulta falha com 503; a nova tentativa funciona.',
  'short-session': 'Sessões expiram 60 s depois do login.',
  'favorite-failure': 'Incluir ou remover favorito responde 500.',
  'register-conflict': 'Qualquer cadastro responde 409 (e-mail já usado).',
  'price-changed': 'O preço do primeiro item do carrinho sobe quando o pedido é enviado.',
  'sold-out': 'A edição do primeiro item esgota quando o pedido é enviado.',
  'order-timeout': 'O pedido é criado, mas a primeira resposta nunca chega (timeout).',
  'payment-declined': 'O pagamento é recusado pela "rede".',
  'payment-pending': 'O pedido fica pendente até um comando de liquidação.',
  'wallet-rejected': 'A carteira recusa o pedido de conexão.',
} as const

export type ScenarioName = keyof typeof SCENARIOS

export function isScenario(value: unknown): value is ScenarioName {
  return typeof value === 'string' && Object.hasOwn(SCENARIOS, value)
}

export const DEFAULT_LATENCY_MS = 120
export const SLOW_LATENCY_MS = 2500
export const SETTLE_DELAY_MS = 2500
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000
export const SHORT_SESSION_TTL_MS = 60 * 1000
