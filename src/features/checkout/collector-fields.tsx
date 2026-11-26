import { Controller, useWatch, type UseFormReturn } from 'react-hook-form'
import { EnsField } from '@/components/form/ens-field'
import { NETWORK_LABELS, PROVIDER_LABELS, type Wallet } from '@/api/contracts'
import { Field } from '@/components/form/field'
import { SelectField } from '@/components/form/select-field'
import { TextField } from '@/components/form/text-field'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { CheckoutValues } from './form-schema'

export function CollectorFields({
  form,
  wallet,
}: {
  form: UseFormReturn<CheckoutValues>
  wallet: Wallet | undefined
}) {
  const useOther = useWatch({ control: form.control, name: 'useOtherAddress' })

  return (
    <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
      <TextField
        form={form}
        name="displayName"
        label="Nome de exibição"
        required
        autoComplete="name"
      />
      <TextField
        form={form}
        name="username"
        label="Nome de usuário"
        required
        autoComplete="username"
      />
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
        name="walletAddress"
        label="Endereço da carteira"
        required
        placeholder="Endereço 0x da carteira"
        readOnly={!useOther}
        spellCheck={false}
      />
      <TextField
        form={form}
        name="secondaryWallet"
        label="ENS ou carteira secundária (opcional)"
        placeholder="ENS ou carteira secundária (opcional)"
        className="md:justify-end [&>label]:md:sr-only"
      />
      <SelectField
        control={form.control}
        name="walletType"
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

      <Controller
        control={form.control}
        name="useOtherAddress"
        render={({ field }) => (
          <Label className="col-span-full gap-2 text-sm font-normal">
            <Checkbox
              checked={field.value}
              onCheckedChange={(checked) => {
                const next = checked === true
                field.onChange(next)
                // ao desmarcar, volta para o endereço da carteira cadastrada
                if (!next && wallet) {
                  form.setValue('walletAddress', wallet.address, { shouldValidate: true })
                }
              }}
              className="border-primary rounded-full"
            />
            Usar outra carteira?
          </Label>
        )}
      />

      <Field
        label="Observação do colecionador (opcional)"
        error={form.formState.errors.note?.message}
        className="col-span-full lg:max-w-[422px]"
      >
        {(control) => <Textarea {...control} {...form.register('note')} maxLength={300} />}
      </Field>
    </div>
  )
}
