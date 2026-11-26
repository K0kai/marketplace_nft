// Valores em ETH trafegam como string decimal. Para somar sem perder precisão,
// convertemos para wei (bigint, 18 casas) e só voltamos para string no final.

const DECIMALS = 18
const WEI = 10n ** BigInt(DECIMALS)
const DECIMAL_PATTERN = /^\d+(\.\d{1,18})?$/

export function isEthString(value: string): boolean {
  return DECIMAL_PATTERN.test(value)
}

export function toWei(value: string): bigint {
  if (!isEthString(value)) throw new Error(`Valor ETH inválido: "${value}"`)
  const [whole = '0', fraction = ''] = value.split('.')
  return BigInt(whole) * WEI + BigInt(fraction.padEnd(DECIMALS, '0'))
}

export function fromWei(wei: bigint): string {
  if (wei < 0n) throw new Error('Valores negativos não são suportados')
  const whole = wei / WEI
  const fraction = (wei % WEI).toString().padStart(DECIMALS, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : `${whole}`
}

export function addEth(...values: string[]): string {
  return fromWei(values.reduce((total, value) => total + toWei(value), 0n))
}

export function subtractEth(a: string, b: string): string {
  const result = toWei(a) - toWei(b)
  return fromWei(result < 0n ? 0n : result)
}

export function multiplyEth(value: string, quantity: number): string {
  if (!Number.isInteger(quantity) || quantity < 0) throw new Error('Quantidade deve ser inteira')
  return fromWei(toWei(value) * BigInt(quantity))
}

/** Percentual em pontos-base (10% = 1000). Arredonda para baixo, a favor da precisão em wei. */
export function percentOfEth(value: string, basisPoints: number): string {
  return fromWei((toWei(value) * BigInt(basisPoints)) / 10_000n)
}

export function compareEth(a: string, b: string): number {
  const diff = toWei(a) - toWei(b)
  return diff === 0n ? 0 : diff > 0n ? 1 : -1
}

/** Apresentação: no mínimo 2 casas, sem cortar casas significativas (26.846 continua 26.846). */
export function formatEth(value: string): string {
  const [whole = '0', fraction = ''] = fromWei(toWei(value)).split('.')
  return `${whole}.${fraction.padEnd(2, '0')}`
}
