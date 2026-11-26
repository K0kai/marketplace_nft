import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { Cart, Profile, Wallet } from '@/api/contracts'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { MobileTopBar } from '@/components/layout/mobile-nav'
import { EmptyState, ErrorState, Loading } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useProfile, useWallets } from '@/features/account/queries'
import { CartNotices } from '@/features/cart/cart-notices'
import { useCart, useQuote } from '@/features/cart/queries'
import { usePendingOrders } from '@/features/orders/queries'
import { useSession } from '@/features/session/session-store'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useIsDesktop } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { CollectorFields } from './collector-fields'
import {
  checkoutFormSchema,
  toCollector,
  valuesFromWallet,
  type CheckoutValues,
} from './form-schema'
import { OrderSummary } from './order-summary'
import { ReviewDialog } from './review-dialog'
import { readDraft, writeDraft } from './storage'
import { useAcceptedQuote } from './use-accepted-quote'
import { useSubmitOrder } from './use-submit-order'
import { useWalletConnection } from './use-wallet-connection'
import { ConnectionStatusBox, ProviderOptions, RegisteredWallets } from './wallet-selection'

function initialValues(userId: string, wallets: Wallet[], profile: Profile): CheckoutValues {
  const primary = wallets.find((w) => w.slot === 'primary') ?? wallets[0]!
  const draft = readDraft<CheckoutValues>(userId)
  // o rascunho (ex.: sessão expirada no meio) só vale se a carteira ainda existir
  if (draft && wallets.some((w) => w.id === draft.walletId)) {
    return { ...valuesFromWallet(primary, profile), ...draft }
  }
  return valuesFromWallet(primary, profile)
}

function EmptyCheckout() {
  return (
    <EmptyState title="Seu carrinho está vazio" description="Adicione um NFT para pagar.">
      <Button asChild>
        <Link to="/">Explorar NFTs</Link>
      </Button>
    </EmptyState>
  )
}

function CheckoutForm({
  userId,
  wallets,
  profile,
  cart,
}: {
  userId: string
  wallets: Wallet[]
  profile: Profile
  cart: Cart
}) {
  const isDesktop = useIsDesktop()
  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: initialValues(userId, wallets, profile),
  })

  // salva o rascunho a cada mudança, sem re-renderizar o formulário
  useEffect(
    () =>
      form.subscribe({
        formState: { values: true },
        callback: ({ values }) => writeDraft(userId, values),
      }),
    [form, userId],
  )

  const [walletId, network, walletType] = useWatch({
    control: form.control,
    name: ['walletId', 'network', 'walletType'],
  })
  const wallet = wallets.find((w) => w.id === walletId)

  const quote = useQuote(network)
  const pending = usePendingOrders().data?.items[0]
  const accepted = useAcceptedQuote(
    quote.data,
    { network, couponCode: cart.couponCode },
    quote.isFetching,
  )
  const walletLink = useWalletConnection({ walletId, provider: walletType, network })
  const order = useSubmitOrder(userId, walletLink.disconnect)

  const [reviewing, setReviewing] = useState(false)
  const [connectionHint, setConnectionHint] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const connectButton = useRef<HTMLButtonElement>(null)

  function selectWallet(id: string) {
    const next = wallets.find((w) => w.id === id)
    if (!next) return
    form.reset({ ...valuesFromWallet(next, profile), note: form.getValues('note') })
    writeDraft(userId, form.getValues())
  }

  function onValid() {
    if (!walletLink.connection) {
      setConnectionHint('Conecte a carteira antes de confirmar a compra.')
      connectButton.current?.focus()
      return
    }
    setConnectionHint(null)
    order.clearError()
    setReviewing(true)
  }

  function review(event: FormEvent) {
    // no celular os dados ficam recolhidos: abre para mostrar o que precisa de ajuste
    void form.handleSubmit(onValid, () => setDetailsOpen(true))(event)
  }

  function send() {
    const values = form.getValues()
    if (!walletLink.connection || !accepted.acceptedId) return
    order.submit({
      quoteId: accepted.acceptedId,
      walletId: values.walletId,
      connectionId: walletLink.connection.id,
      provider: values.walletType,
      network: values.network,
      collector: checkoutFormSchema.transform(toCollector).parse(values),
    })
  }

  const blocked =
    !quote.data ||
    !quote.data.purchasable ||
    accepted.isStale ||
    quote.isFetching ||
    Boolean(pending)

  // com um envio sem resposta, o carrinho pode esvaziar porque o pedido foi confirmado:
  // a tela precisa continuar aqui para o usuário recuperar esse pedido
  if (cart.items.length === 0 && !order.sending && !order.unresolved) return <EmptyCheckout />

  return (
    <form onSubmit={review} noValidate>
      {pending && (
        <p role="status" className="border-primary bg-band mb-4 border p-3 text-xs">
          Você tem um pedido aguardando confirmação.{' '}
          <Link
            to="/orders/$orderId"
            params={{ orderId: pending.id }}
            className="text-highlight underline"
          >
            Acompanhar pedido
          </Link>
        </p>
      )}
      {order.unresolved && !reviewing && !order.sending && !pending && (
        <div
          role="alert"
          className="border-primary bg-band mb-4 flex flex-wrap items-center gap-3 border p-3 text-xs"
        >
          <p className="flex-1">
            O último envio ficou sem resposta. Verifique antes de comprar novamente.
          </p>
          <Button type="button" size="sm" onClick={order.recover}>
            Recuperar pedido
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={order.discard}>
            Descartar
          </Button>
        </div>
      )}
      <CartNotices />

      <div className="grid gap-8 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_407px] lg:gap-8">
        <div className="min-w-0">
          <h1 className="mb-4 text-base font-bold max-md:sr-only">Perfil do colecionador</h1>
          <RegisteredWallets wallets={wallets} value={walletId} onChange={selectWallet} />

          {!isDesktop && (
            <button
              type="button"
              aria-expanded={detailsOpen}
              aria-controls="collector-details"
              onClick={() => setDetailsOpen((open) => !open)}
              className="bg-card mb-4 flex w-full items-center justify-between rounded-[14px] p-4 text-sm font-bold"
            >
              Dados do colecionador
              <ChevronDown
                className={cn('size-4 transition-transform', detailsOpen && 'rotate-180')}
                aria-hidden="true"
              />
            </button>
          )}
          <div id="collector-details" className={cn(!isDesktop && !detailsOpen && 'hidden')}>
            <CollectorFields form={form} wallet={wallet} />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="max-md:order-3">
            {isDesktop && <OrderSummary quote={quote.data} couponCode={cart.couponCode} />}
          </div>

          <section aria-labelledby="provider-title" className="max-md:order-1">
            <h2 id="provider-title" className="mb-3 text-sm font-bold md:text-center">
              Carteira e rede
            </h2>
            <ProviderOptions
              value={walletType}
              onChange={(provider) => form.setValue('walletType', provider, { shouldDirty: true })}
            />
            <ConnectionStatusBox
              buttonRef={connectButton}
              connected={Boolean(walletLink.connection)}
              connecting={walletLink.connecting}
              error={walletLink.error ?? (walletLink.connection ? null : connectionHint)}
              onConnect={() => {
                setConnectionHint(null)
                walletLink.connect()
              }}
              onDisconnect={walletLink.disconnect}
            />
          </section>

          <div className="max-md:order-2">
            {!isDesktop && <OrderSummary quote={quote.data} couponCode={cart.couponCode} />}
          </div>

          <div className="max-md:order-4">
            {quote.isError && !quote.data && (
              <ErrorState
                error={quote.error}
                onRetry={() => void quote.refetch()}
                className="mb-3 p-4"
              />
            )}
            {accepted.isStale && !reviewing && (
              <div role="alert" className="border-destructive mb-3 border p-3 text-xs">
                <p className="font-bold">A cotação mudou. Revise os novos valores.</p>
                <Button type="button" size="sm" className="mt-2" onClick={accepted.accept}>
                  Aceitar novos valores
                </Button>
              </div>
            )}
            <Button
              type="submit"
              size="xl"
              disabled={blocked}
              className="w-full max-md:rounded-full"
            >
              Confirmar compra
            </Button>
          </div>
        </div>
      </div>

      {quote.data && (
        <ReviewDialog
          open={reviewing}
          onOpenChange={setReviewing}
          values={form.getValues()}
          quote={quote.data}
          isStale={accepted.isStale}
          previousTotal={accepted.previousTotal}
          onAcceptQuote={() => {
            order.clearError()
            accepted.accept()
          }}
          updating={quote.isFetching}
          onSend={send}
          order={order}
        />
      )}
    </form>
  )
}

export function CheckoutPage() {
  useDocumentTitle('Pagamento')
  const userId = useSession()?.userId ?? ''
  const cart = useCart()
  const wallets = useWallets()
  const profile = useProfile()

  const failed = [cart, wallets, profile].find((query) => query.isError && !query.data)

  function content() {
    if (failed) {
      return <ErrorState error={failed.error} onRetry={() => void failed.refetch()} />
    }
    if (!cart.data || !wallets.data || !profile.data) {
      return (
        <Loading label="Carregando pagamento" className="grid gap-8 md:grid-cols-[1fr_407px]">
          <Skeleton className="h-[620px]" />
          <Skeleton className="h-[480px]" />
        </Loading>
      )
    }
    if (wallets.data.length === 0) {
      return (
        <EmptyState
          title="Cadastre uma carteira"
          description="O pagamento usa as carteiras cadastradas na sua conta."
        >
          <Button asChild>
            <Link to="/profile/wallets">Cadastrar carteira</Link>
          </Button>
        </EmptyState>
      )
    }
    return (
      <CheckoutForm
        key={userId}
        userId={userId}
        wallets={wallets.data}
        profile={profile.data}
        cart={cart.data}
      />
    )
  }

  return (
    <>
      <MobileTopBar title="Pagamento com carteira" />
      <div className="page-container max-md:pb-8">
        <div className="max-md:hidden">
          <Breadcrumbs
            items={[
              { label: 'Início', to: '/' },
              { label: 'Mercado', to: '/' },
              { label: 'Pagamento' },
            ]}
          />
        </div>
        {content()}
      </div>
    </>
  )
}
