import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'
import { toApiError } from '@/api/errors'

/**
 * Leva os erros da API para os campos do formulário e foca o primeiro.
 * Devolve a mensagem geral quando não há campo a quem atribuir.
 */
export function applyApiErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  error: unknown,
): string | undefined {
  const apiError = toApiError(error)
  const known = Object.keys(form.getValues())
  const entries = Object.entries(apiError.fieldErrors).filter(([field]) => known.includes(field))

  entries.forEach(([field, message], index) => {
    form.setError(field as Path<T>, { type: 'server', message }, { shouldFocus: index === 0 })
  })
  return entries.length > 0 ? undefined : apiError.message
}
