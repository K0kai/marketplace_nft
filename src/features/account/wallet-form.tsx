import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { EnsField } from '@/components/form/ens-field'
import { toast } from 'sonner'
import {
  NETWORK_LABELS,
  PROVIDER_LABELS,
  walletInputSchema,
  type Wallet,
  type WalletInput,
  type WalletSlot,
} from '@/api/contracts'
import { FormError } from '@/components/form/field'
import { SelectField } from '@/components/form/select-field'
import { TextField } from '@/components/form/text-field'
import { Button } from '@/components/ui/button'
import { applyApiErrors } from '@/lib/form'
import { useSaveWallet } from './queries'

export function emptyWallet(slot: WalletSlot): Partial<WalletInput> {
  return {
    slot,
    displayName: '',
    nickname: '',
    profileName: '',
    address: '',
    secondaryAddress: '',
    referralCode: '',
    email: '',
    ensSuffix: '.eth',
    ensName: '',
  }
}

export function WalletForm({
  slot,
  wallet,
  defaults,
  onSaved,
}: {
  slot: WalletSlot
  wallet?: Wallet
  defaults?: Partial<WalletInput>
  onSaved?: () => void
}) {
  const save = useSaveWallet()
  const form = useForm<WalletInput>({
    resolver: zodResolver(walletInputSchema),
    defaultValues: wallet ?? defaults ?? emptyWallet(slot),
  })
  const suffix = slot === 'primary' ? 'principal' : 'secundária'

  const submit = form.handleSubmit(async (values) => {
    try {
      await save.mutateAsync({ id: wallet?.id, input: { ...values, slot } })
      toast.success(`Carteira ${suffix} salva.`)
      onSaved?.()
    } catch (error) {
      form.setError('root', { message: applyApiErrors(form, error) })
    }
  })

  return (
    <form onSubmit={submit} noValidate aria-label={`Carteira ${suffix}`} className="mt-5">
      <FormError message={form.formState.errors.root?.message} />
      <div className="grid gap-x-9 gap-y-4 md:grid-cols-2">
        <TextField form={form} name="displayName" label="Nome de exibição" required />
        <TextField form={form} name="nickname" label="Apelido da carteira" required />
        <SelectField
          control={form.control}
          name="network"
          label="Rede"
          required
          placeholder="Selecione uma rede"
          options={NETWORK_LABELS}
        />
        <TextField form={form} name="profileName" label="Nome do perfil" required />
        <TextField
          form={form}
          name="address"
          label="Endereço da carteira"
          required
          placeholder="Endereço 0x da carteira"
          spellCheck={false}
        />
        <TextField
          form={form}
          name="secondaryAddress"
          label="ENS ou carteira secundária (opcional)"
          placeholder="ENS ou carteira secundária (opcional)"
          className="md:justify-end [&>label]:md:sr-only"
        />
        <SelectField
          control={form.control}
          name="provider"
          label="Tipo de carteira"
          required
          placeholder="Selecione uma carteira"
          options={PROVIDER_LABELS}
        />
        <TextField form={form} name="referralCode" label="Código de indicação" required />
        <TextField
          form={form}
          name="email"
          label="E-mail"
          required
          type="email"
          autoComplete="email"
        />
        <EnsField form={form} />
      </div>
      <Button type="submit" size="lg" className="mt-6 max-md:w-full" disabled={save.isPending}>
        {save.isPending ? 'Salvando…' : 'Salvar carteira'}
      </Button>
    </form>
  )
}
