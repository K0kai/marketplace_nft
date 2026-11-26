import { useState } from 'react'
import type { Quote } from '@/api/contracts'

type Accepted = { choiceKey: string; quoteId: string; total: string }

/**
 * Guarda a cotação que o usuário viu. Mudanças que ele mesmo fez (rede, cupom) são aceitas
 * automaticamente; mudanças vindas do servidor deixam a cotação "velha" até ele aceitar.
 */
export function useAcceptedQuote(
  quote: Quote | undefined,
  choice: { network: string; couponCode: string | null },
  isFetching: boolean,
) {
  const choiceKey = `${choice.network}|${choice.couponCode ?? ''}`
  const [accepted, setAccepted] = useState<Accepted | null>(null)

  const matchesChoice =
    quote &&
    !isFetching &&
    quote.network === choice.network &&
    (quote.coupon?.code ?? null) === (quote.couponError ? null : choice.couponCode)

  if (matchesChoice && accepted?.choiceKey !== choiceKey) {
    setAccepted({ choiceKey, quoteId: quote.id, total: quote.total })
  }

  const isStale = Boolean(
    quote && accepted && accepted.choiceKey === choiceKey && quote.id !== accepted.quoteId,
  )

  return {
    acceptedId: accepted?.choiceKey === choiceKey ? accepted.quoteId : null,
    previousTotal: accepted?.total,
    isStale,
    accept() {
      if (quote) setAccepted({ choiceKey, quoteId: quote.id, total: quote.total })
    },
  }
}
