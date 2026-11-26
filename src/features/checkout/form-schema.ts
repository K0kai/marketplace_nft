import { z } from 'zod'
import { collectorSchema, type Collector, type Profile, type Wallet } from '@/api/contracts'

export const checkoutFormSchema = collectorSchema.extend({
  walletId: z.string().min(1, 'Escolha uma carteira'),
  useOtherAddress: z.boolean(),
})

export type CheckoutValues = z.infer<typeof checkoutFormSchema>

/** A carteira cadastrada preenche o formulário; o usuário pode revisar tudo. */
export function valuesFromWallet(wallet: Wallet, profile: Profile): CheckoutValues {
  return {
    walletId: wallet.id,
    displayName: wallet.displayName,
    username: profile.username,
    network: wallet.network,
    profileName: wallet.profileName,
    walletAddress: wallet.address,
    secondaryWallet: wallet.secondaryAddress ?? '',
    walletType: wallet.provider,
    referralCode: wallet.referralCode,
    email: wallet.email,
    ensSuffix: wallet.ensSuffix,
    ensName: wallet.ensName,
    note: '',
    useOtherAddress: false,
  }
}

export function toCollector(values: CheckoutValues): Collector {
  const { walletId: _wallet, useOtherAddress: _other, ...collector } = values
  return collector
}
