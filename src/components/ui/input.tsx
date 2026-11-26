import * as React from 'react'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'border-input placeholder:text-subtle focus-visible:border-primary aria-invalid:border-destructive h-12 w-full min-w-0 rounded-[4px] border bg-transparent px-3 text-base outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
