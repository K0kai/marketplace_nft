import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function PasswordInput({ className, ...props }: React.ComponentProps<'input'>) {
  const [visible, setVisible] = useState(false)
  const Icon = visible ? Eye : EyeOff
  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} className={cn('pr-12', className)} />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-pressed={visible}
        aria-label="Mostrar senha"
        className="text-subtle hover:text-highlight absolute inset-y-0 right-0 flex w-11 items-center justify-center"
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
