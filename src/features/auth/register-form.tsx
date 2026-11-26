import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { registerInputSchema, type RegisterInput } from '@/api/contracts'
import { Field, FormError } from '@/components/form/field'
import { PasswordInput } from '@/components/form/password-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useIsDesktop } from '@/hooks/use-media-query'
import { applyApiErrors } from '@/lib/form'
import { useRegister } from './mutations'

const inputClass = 'max-md:h-14 max-md:rounded-[10px]'

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const register = useRegister()
  const isDesktop = useIsDesktop()
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerInputSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  })
  const { errors } = form.formState

  const submit = form.handleSubmit((values) =>
    register.mutate(values, {
      onSuccess,
      onError: (error) => form.setError('root', { message: applyApiErrors(form, error) }),
    }),
  )

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <FormError message={errors.root?.message} />
      <Field label="Nome de usuário" hideLabel required error={errors.username?.message}>
        {(control) => (
          <Input
            {...control}
            {...form.register('username')}
            autoComplete="username"
            placeholder="Nome de usuário"
            className={inputClass}
          />
        )}
      </Field>
      <Field label="E-mail" hideLabel required error={errors.email?.message}>
        {(control) => (
          <Input
            {...control}
            {...form.register('email')}
            type="email"
            autoComplete="email"
            placeholder="Digite seu e-mail"
            className={inputClass}
          />
        )}
      </Field>
      <Field label="Senha" hideLabel required error={errors.password?.message}>
        {(control) => (
          <PasswordInput
            {...control}
            {...form.register('password')}
            autoComplete="new-password"
            placeholder="Senha"
            className={inputClass}
          />
        )}
      </Field>
      <Field label="Confirmar senha" hideLabel required error={errors.confirmPassword?.message}>
        {(control) => (
          <PasswordInput
            {...control}
            {...form.register('confirmPassword')}
            autoComplete="new-password"
            placeholder="Confirmar senha"
            className={inputClass}
          />
        )}
      </Field>
      <Button type="submit" size="lg" disabled={register.isPending} className="mt-3 max-md:h-14">
        {register.isPending ? 'Criando…' : isDesktop ? 'Criar conta' : 'Criar perfil'}
      </Button>
    </form>
  )
}
