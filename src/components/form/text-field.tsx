import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Field } from './field'

/** Campo de texto ligado ao react-hook-form, com o erro já associado. */
export function TextField<T extends FieldValues>({
  form,
  name,
  label,
  required,
  hideLabel,
  className,
  inputClassName,
  ...input
}: {
  form: UseFormReturn<T>
  name: Path<T>
  label: string
  required?: boolean
  hideLabel?: boolean
  className?: string
  inputClassName?: string
} & Omit<React.ComponentProps<'input'>, 'form' | 'name' | 'className' | 'required'>) {
  const error = form.getFieldState(name, form.formState).error?.message
  return (
    <Field
      label={label}
      required={required}
      hideLabel={hideLabel}
      error={error}
      className={className}
    >
      {(control) => (
        <Input {...control} {...input} {...form.register(name)} className={inputClassName} />
      )}
    </Field>
  )
}
