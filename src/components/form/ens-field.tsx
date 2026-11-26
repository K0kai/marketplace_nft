import type { Control, FieldValues, Path, UseFormReturn } from 'react-hook-form'
import { SelectField } from './select-field'
import { TextField } from './text-field'

/** Sufixo + nome sob um único rótulo visível, como no layout. */
export function EnsField<T extends FieldValues>({ form }: { form: UseFormReturn<T> }) {
  return (
    <div className="relative grid grid-cols-[96px_1fr] items-start gap-x-2 pt-6">
      <span aria-hidden="true" className="absolute top-0 left-0 flex gap-0.5 text-sm leading-5">
        Nome ENS<span className="text-destructive text-lg leading-none">*</span>
      </span>
      <SelectField
        control={form.control as Control<T>}
        name={'ensSuffix' as Path<T>}
        label="Sufixo ENS"
        hideLabel
        required
        options={{ '.eth': '.eth' }}
      />
      <TextField
        form={form}
        name={'ensName' as Path<T>}
        label="Nome ENS"
        hideLabel
        required
        spellCheck={false}
      />
    </div>
  )
}
