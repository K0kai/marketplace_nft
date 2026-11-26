import { Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { EDITION_LABELS, type CartItem } from '@/api/contracts'
import { NftImage } from '@/components/nft-image'
import { Price } from '@/components/price'
import { QuantityStepper } from '@/components/quantity-stepper'
import { useRemoveCartItem, useUpdateCartItem } from './queries'

const ISSUE_TEXT = {
  SOLD_OUT: () => 'Edição esgotada. Remova o item para continuar.',
  INSUFFICIENT_STOCK: (item: CartItem) =>
    `Só há ${item.maxQuantity} disponível(is). Reduza a quantidade para continuar.`,
}

export function CartLine({ item }: { item: CartItem }) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const busy = update.isPending || remove.isPending
  const name = `${item.name}, edição ${EDITION_LABELS[item.editionId]}`

  return (
    <li className="bg-card grid grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-x-3 overflow-hidden rounded-[18px] pr-3 md:grid-cols-[70px_minmax(0,2fr)_1fr_minmax(100px,1fr)_1fr_40px] md:rounded-none">
      <NftImage
        artwork={item.artwork}
        alt=""
        sizes="96px"
        className="row-span-2 h-full md:row-span-1"
      />

      <div className="min-w-0 py-2 md:py-0">
        <h3 className="text-sm leading-tight font-bold">
          <Link
            to="/nft/$nftId"
            params={{ nftId: item.nftId }}
            search={{ edition: item.editionId }}
          >
            {item.name}
          </Link>
        </h3>
        <p className="text-subtle text-xs">
          <span className="block max-md:hidden">ID do token: #{item.tokenId}</span>
          <span className="block">Edição: {EDITION_LABELS[item.editionId]}</span>
        </p>
        <p className="mt-2 md:hidden">
          <Price value={item.lineTotal} />
        </p>
      </div>

      <p className="text-muted-foreground text-xs font-bold max-md:hidden">
        <span className="sr-only">Preço unitário: </span>
        <Price value={item.unitPrice} className="text-muted-foreground" />
      </p>

      <div className="flex flex-col items-end gap-2 max-md:row-span-2 md:items-start">
        <QuantityStepper
          label={name}
          value={item.quantity}
          max={item.maxQuantity}
          busy={busy}
          onChange={(quantity) => update.mutate({ id: item.id, quantity })}
        />
        <button
          type="button"
          onClick={() => remove.mutate(item.id)}
          disabled={busy}
          aria-label={`Remover ${name}`}
          className="text-primary flex size-8 items-center justify-center md:hidden"
        >
          <Trash2 className="size-5" aria-hidden="true" />
        </button>
      </div>

      <p className="text-sm max-md:hidden">
        <span className="sr-only">Total do item: </span>
        <Price value={item.lineTotal} />
      </p>

      <button
        type="button"
        onClick={() =>
          remove.mutate(item.id, { onSuccess: () => toast.success(`${item.name} removido.`) })
        }
        disabled={busy}
        aria-label={`Remover ${name}`}
        className="text-primary flex size-9 items-center justify-center max-md:hidden"
      >
        <Trash2 className="size-5" aria-hidden="true" />
      </button>

      {item.issue && (
        <p role="alert" className="text-destructive col-span-full px-3 py-2 text-xs">
          {ISSUE_TEXT[item.issue](item)}
          {item.issue === 'INSUFFICIENT_STOCK' && item.maxQuantity > 0 && (
            <button
              type="button"
              className="ml-2 underline"
              onClick={() => update.mutate({ id: item.id, quantity: item.maxQuantity })}
            >
              Ajustar para {item.maxQuantity}
            </button>
          )}
        </p>
      )}
    </li>
  )
}
