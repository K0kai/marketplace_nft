import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Field } from './field'

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  options,
  required,
  hideLabel,
  className,
  triggerClassName,
}: {
  control: Control<T>
  name: Path<T>
  label: string
  placeholder?: string
  options: Record<string, string>
  required?: boolean
  hideLabel?: boolean
  className?: string
  triggerClassName?: string
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field
          label={label}
          required={required}
          hideLabel={hideLabel}
          error={fieldState.error?.message}
          className={className}
        >
          {(props) => (
            <Select value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger
                {...props}
                ref={field.ref}
                onBlur={field.onBlur}
                className={cn('w-full', triggerClassName)}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent className="bg-card" position="popper">
                {Object.entries(options).map(([value, text]) => (
                  <SelectItem key={value} value={value}>
                    {text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
      )}
    />
  )
}
