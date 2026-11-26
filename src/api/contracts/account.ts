import { z } from 'zod'
import { networkSchema, walletProviderSchema } from './common.ts'

// Os mesmos schemas validam o formulário no cliente e o corpo no mock da API.

const required = (label: string) => z.string().trim().min(1, `Informe ${label}`)

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe o e-mail')
  .pipe(z.email('E-mail inválido'))

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Use ao menos 3 caracteres')
  .max(24, 'Use no máximo 24 caracteres')
  .regex(/^[a-zA-Z0-9_.]+$/, 'Use apenas letras, números, ponto ou _')

export const newPasswordSchema = z
  .string()
  .min(8, 'A senha precisa de ao menos 8 caracteres')
  .regex(/[a-zA-Z]/, 'Inclua ao menos uma letra')
  .regex(/\d/, 'Inclua ao menos um número')

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha'),
})
export type LoginInput = z.infer<typeof loginInputSchema>

export const registerInputSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirme a senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  })
export type RegisterInput = z.infer<typeof registerInputSchema>

export const ensSuffixSchema = z.enum(['.eth'])

const ensNameSchema = required('o nome ENS').regex(
  /^[a-z0-9-.]+$/i,
  'Use letras, números, ponto ou hífen',
)

export const walletAddressSchema = required('o endereço da carteira').regex(
  /^0x[a-fA-F0-9]{40}$/,
  'Endereço inválido: use 0x seguido de 40 caracteres hexadecimais',
)

export const profileSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
  email: z.string(),
  ensName: z.string(),
  ensSuffix: ensSuffixSchema,
  walletNickname: z.string(),
  avatarUrl: z.string().nullable(),
})
export type Profile = z.infer<typeof profileSchema>

export const profileInputSchema = z.object({
  displayName: required('o nome de exibição').max(60),
  username: usernameSchema,
  email: emailSchema,
  ensName: ensNameSchema,
  ensSuffix: ensSuffixSchema,
  walletNickname: required('o apelido da carteira').max(40),
})
export type ProfileInput = z.infer<typeof profileInputSchema>

export const passwordInputSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: newPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ['newPassword'],
    message: 'A nova senha precisa ser diferente da atual',
  })
export type PasswordInput = z.infer<typeof passwordInputSchema>

export const AVATAR_MAX_BYTES = 512 * 1024
export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

export const avatarInputSchema = z.object({ dataUrl: z.string() })

export const sessionSchema = z.object({
  token: z.string(),
  expiresAt: z.string(),
  user: profileSchema,
})
export type Session = z.infer<typeof sessionSchema>

export const walletSlotSchema = z.enum(['primary', 'secondary'])
export type WalletSlot = z.infer<typeof walletSlotSchema>

export const walletInputSchema = z.object({
  slot: walletSlotSchema,
  displayName: required('o nome de exibição').max(60),
  nickname: required('o apelido da carteira').max(40),
  network: z.enum(networkSchema.options, { error: 'Selecione uma rede' }),
  profileName: required('o nome do perfil').max(60),
  address: walletAddressSchema,
  secondaryAddress: z.string().trim().max(80).optional(),
  provider: z.enum(walletProviderSchema.options, { error: 'Selecione o tipo de carteira' }),
  referralCode: required('o código de indicação').max(24),
  email: emailSchema,
  ensSuffix: ensSuffixSchema,
  ensName: ensNameSchema,
})
export type WalletInput = z.infer<typeof walletInputSchema>

export const walletSchema = walletInputSchema.extend({ id: z.string() })
export type Wallet = z.infer<typeof walletSchema>

export const walletListSchema = z.object({ items: z.array(walletSchema) })

export const walletConnectionInputSchema = z.object({
  walletId: z.string(),
  provider: walletProviderSchema,
  network: networkSchema,
})
export type WalletConnectionInput = z.infer<typeof walletConnectionInputSchema>

export const walletConnectionSchema = walletConnectionInputSchema.extend({
  id: z.string(),
  status: z.literal('connected'),
})
export type WalletConnection = z.infer<typeof walletConnectionSchema>
