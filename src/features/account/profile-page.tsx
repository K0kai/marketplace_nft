import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { EnsField } from '@/components/form/ens-field'
import { toast } from 'sonner'
import {
  passwordInputSchema,
  profileInputSchema,
  type PasswordInput as PasswordValues,
  type Profile,
  type ProfileInput,
} from '@/api/contracts'
import { Field, FormError } from '@/components/form/field'
import { PasswordInput } from '@/components/form/password-input'
import { TextField } from '@/components/form/text-field'
import { ErrorState, Loading } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { applyApiErrors } from '@/lib/form'
import { AvatarField } from './avatar-field'
import { useChangePassword, useProfile, useUpdateProfile } from './queries'

const EMPTY_PASSWORD: PasswordValues = { currentPassword: '', newPassword: '', confirmPassword: '' }

const PASSWORD_FIELDS = [
  { name: 'currentPassword', label: 'Senha atual', autoComplete: 'current-password' },
  { name: 'newPassword', label: 'Nova senha', autoComplete: 'new-password' },
  { name: 'confirmPassword', label: 'Confirmar nova senha', autoComplete: 'new-password' },
] as const

/** Um botão "Salvar" como no layout; a senha só é validada se algum campo dela for preenchido. */
function ProfileForm({ profile }: { profile: Profile }) {
  const update = useUpdateProfile()
  const changePassword = useChangePassword()
  const [saving, setSaving] = useState(false)

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileInputSchema),
    defaultValues: {
      displayName: profile.displayName,
      username: profile.username,
      email: profile.email,
      ensName: profile.ensName,
      ensSuffix: profile.ensSuffix,
      walletNickname: profile.walletNickname,
    },
  })
  const password = useForm<PasswordValues>({
    resolver: zodResolver(passwordInputSchema),
    defaultValues: EMPTY_PASSWORD,
  })

  async function saveProfile(values: ProfileInput) {
    try {
      await update.mutateAsync(values)
      form.reset(values)
      toast.success('Perfil salvo.')
    } catch (error) {
      form.setError('root', { message: applyApiErrors(form, error) })
    }
  }

  async function savePassword(values: PasswordValues) {
    try {
      await changePassword.mutateAsync(values)
      password.reset(EMPTY_PASSWORD)
      toast.success('Senha alterada.')
    } catch (error) {
      password.setError('root', { message: applyApiErrors(password, error) })
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const wantsPassword = Object.values(password.getValues()).some(Boolean)
    setSaving(true)
    form.clearErrors('root')
    password.clearErrors('root')
    await form.handleSubmit(saveProfile)()
    if (wantsPassword) await password.handleSubmit(savePassword)()
    setSaving(false)
  }

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="mb-6 text-base font-bold">Perfil do colecionador</h1>
      <FormError message={form.formState.errors.root?.message} />
      <div className="grid gap-x-9 gap-y-5 md:grid-cols-2">
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
        <TextField
          form={form}
          name="email"
          label="E-mail"
          required
          type="email"
          autoComplete="email"
        />
        <EnsField form={form} />
        <TextField form={form} name="walletNickname" label="Apelido da carteira" required />
        <AvatarField profile={profile} />
      </div>

      <fieldset className="mt-8 flex flex-col gap-5 md:w-[calc(50%-18px)]">
        <legend className="mb-4 text-base font-bold">Alterar senha</legend>
        <FormError message={password.formState.errors.root?.message} />
        {PASSWORD_FIELDS.map(({ name, label, autoComplete }) => (
          <Field key={name} label={label} error={password.formState.errors[name]?.message}>
            {(control) => (
              <PasswordInput
                {...control}
                {...password.register(name)}
                autoComplete={autoComplete}
              />
            )}
          </Field>
        ))}
      </fieldset>

      <Button
        type="submit"
        size="lg"
        className="mt-8 min-w-[130px] max-md:w-full"
        disabled={saving}
      >
        {saving ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  )
}

export function ProfilePage() {
  useDocumentTitle('Perfil do colecionador')
  const profile = useProfile()

  if (profile.data) return <ProfileForm key={profile.data.id} profile={profile.data} />
  if (profile.isError) {
    return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />
  }
  return (
    <Loading label="Carregando perfil" className="grid gap-5 md:grid-cols-2">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-[74px]" />
      ))}
    </Loading>
  )
}
