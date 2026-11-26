import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { EDITION_LABELS, type EditionId, type NftDetail } from '@/api/contracts'
import { useAddToCart, useCart } from '@/features/cart/queries'
import { defaultEdition } from '@/lib/editions'

/** Edição escolhida, limite de quantidade (já descontando o carrinho) e ações de compra. */
export function usePurchase(nft: NftDetail, requestedEdition: EditionId | undefined) {
  const navigate = useNavigate()
  const cart = useCart()
  const addToCart = useAddToCart()
  const [wanted, setWanted] = useState(1)

  const edition =
    nft.editions.find((e) => e.id === requestedEdition) ?? defaultEdition(nft.editions)
  const inCart =
    cart.data?.items.find((i) => i.nftId === nft.id && i.editionId === edition.id)?.quantity ?? 0
  const limit = Math.min(edition.available, edition.maxPerOrder)
  const remaining = Math.max(0, limit - inCart)
  // se o estoque cair por um evento, a quantidade escolhida acompanha
  const quantity = Math.max(1, Math.min(wanted, remaining))

  const unavailableReason =
    edition.available === 0
      ? `A edição ${EDITION_LABELS[edition.id]} está esgotada. Escolha outra edição.`
      : remaining === 0
        ? `Você já tem no carrinho o limite desta edição (${limit}).`
        : null

  function add(options: { goToCart: boolean }) {
    addToCart.mutate(
      { nftId: nft.id, editionId: edition.id, quantity },
      {
        onSuccess: () => {
          setWanted(1)
          if (options.goToCart) void navigate({ to: '/cart' })
          else toast.success(`${nft.name} adicionado ao carrinho.`)
        },
      },
    )
  }

  function selectEdition(id: EditionId) {
    setWanted(1)
    void navigate({
      to: '/nft/$nftId',
      params: { nftId: nft.id },
      search: { edition: id },
      replace: true,
      resetScroll: false,
    })
  }

  return {
    edition,
    inCart,
    limit,
    remaining,
    quantity,
    setQuantity: setWanted,
    selectEdition,
    add,
    adding: addToCart.isPending,
    unavailableReason,
  }
}

export type Purchase = ReturnType<typeof usePurchase>
