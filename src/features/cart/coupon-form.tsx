import { useId, useState, type FormEvent } from 'react'
import { toApiError } from '@/api/errors'
import { Button } from '@/components/ui/button'
import { useApplyCoupon, useRemoveCoupon } from './queries'

export function CouponForm({ appliedCode }: { appliedCode: string | null }) {
  const [code, setCode] = useState('')
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const inputId = useId()
  const errorId = useId()
  const error = apply.error
    ? (toApiError(apply.error).fieldErrors.code ?? toApiError(apply.error).message)
    : null

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!code.trim()) return
    apply.mutate(code.trim(), { onSuccess: () => setCode('') })
  }

  if (appliedCode) {
    return (
      <p className="border-primary flex items-center justify-between gap-2 rounded-[4px] border border-dashed px-3 py-2 text-xs">
        <span role="status">
          Cupom <strong>{appliedCode}</strong> aplicado
        </span>
        <button
          type="button"
          className="text-highlight underline"
          onClick={() => remove.mutate()}
          disabled={remove.isPending}
        >
          Remover cupom
        </button>
      </p>
    )
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={inputId} className="mb-2 block text-xs font-bold max-md:sr-only">
        Código promocional
      </label>
      <div className="border-primary max-md:border-border flex overflow-hidden rounded-[4px] border max-md:rounded-full">
        <input
          id={inputId}
          value={code}
          onChange={(event) => {
            setCode(event.target.value)
            if (apply.isError) apply.reset()
          }}
          placeholder="Digite o código promocional..."
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="placeholder:text-subtle min-w-0 flex-1 bg-transparent px-3 text-base md:text-xs"
        />
        <Button
          type="submit"
          disabled={apply.isPending}
          className="h-11 rounded-none max-md:rounded-full max-md:px-7"
        >
          {apply.isPending ? 'Aplicando…' : 'Aplicar'}
        </Button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-destructive mt-2 text-xs">
          {error}
        </p>
      )}
    </form>
  )
}
