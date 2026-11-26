import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { loginInputSchema, type LoginInput } from '@/api/contracts'
import { Field, FormError } from '@/components/form/field'
import { PasswordInput } from '@/components/form/password-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { applyApiErrors } from '@/lib/form'
import { useLogin } from './mutations'

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const login = useLogin()
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
    defaultValues: { email: '', password: '' },
  })
  const { errors } = form.formState

  const submit = form.handleSubmit((values) =>
    login.mutate(values, {
      onSuccess,
      onError: (error) => form.setError('root', { message: applyApiErrors(form, error) }),
    }),
  )

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <FormError message={errors.root?.message} />
      <Field label="E-mail" hideLabel required error={errors.email?.message}>
        {(control) => (
          <Input
            {...control}
            {...form.register('email')}
            type="email"
            autoComplete="email"
            placeholder="contato@email.com"
            className="max-md:h-14 max-md:rounded-[10px]"
          />
        )}
      </Field>
      <Field label="Senha" hideLabel required error={errors.password?.message}>
        {(control) => (
          <PasswordInput
            {...control}
            {...form.register('password')}
            autoComplete="current-password"
            placeholder="Senha"
            className="max-md:h-14 max-md:rounded-[10px]"
          />
        )}
      </Field>
      <button
        type="button"
        className="text-highlight self-end text-xs"
        onClick={() => toast.info('A recuperação de senha não está disponível nesta demonstração.')}
      >
        Esqueceu a senha?
      </button>
      <Button type="submit" size="lg" disabled={login.isPending} className="mt-2 max-md:h-14">
        {login.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
