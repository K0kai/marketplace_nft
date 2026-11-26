import { toast } from 'sonner'

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22 12.200c0-.700-.100-1.400-.200-2H12v3.900h5.600a4.800 4.800 0 0 1-2.100 3.100v2.600h3.400c2-1.800 3.100-4.500 3.100-7.600z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.800 0 5.200-.900 6.900-2.500l-3.400-2.600c-.9.600-2.100 1-3.500 1-2.700 0-5-1.800-5.8-4.300H2.700v2.700A10 10 0 0 0 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.2 13.600a6 6 0 0 1 0-3.800V7.100H2.7a10 10 0 0 0 0 9.200l3.500-2.700z"
      />
      <path
        fill="#EA4335"
        d="M12 5.500c1.500 0 2.9.5 4 1.600l3-3A10 10 0 0 0 2.700 7.1l3.5 2.7C7 7.300 9.300 5.5 12 5.5z"
      />
    </svg>
  )
}

export function SocialButtons() {
  // login social está fora do escopo: o botão explica isso em vez de simular sucesso
  const unavailable = (provider: string) => () =>
    toast.info(`Entrar com ${provider} não está disponível nesta demonstração.`)

  const buttonClass =
    'border-border text-muted-foreground hover:border-primary flex h-10 items-center justify-center gap-3 rounded-[4px] border text-xs font-bold'

  return (
    <div className="flex flex-col gap-3">
      <p className="before:bg-border after:bg-border flex items-center gap-3 text-xs before:h-px before:flex-1 after:h-px after:flex-1">
        Ou continue com
      </p>
      <button type="button" className={buttonClass} onClick={unavailable('Google')}>
        <GoogleMark /> Continuar com Google
      </button>
      <button type="button" className={buttonClass} onClick={unavailable('Facebook')}>
        <span aria-hidden="true" className="text-xl font-bold text-[#6d8fd6]">
          f
        </span>
        Continuar com Facebook
      </button>
    </div>
  )
}
