import { Toaster as Sonner, type ToasterProps } from 'sonner'

// a aplicação só tem tema escuro, então não precisamos do next-themes
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--line-strong)',
          '--border-radius': '0.375rem',
          fontFamily: 'inherit',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
