import { ImageIcon } from 'lucide-react'
import { useId, useRef, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { AVATAR_MAX_BYTES, AVATAR_TYPES, type Profile } from '@/api/contracts'
import { toApiError } from '@/api/errors'
import { Button } from '@/components/ui/button'
import { useRemoveAvatar, useSetAvatar } from './queries'

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function AvatarField({ profile }: { profile: Profile }) {
  const input = useRef<HTMLInputElement>(null)
  const errorId = useId()
  const upload = useSetAvatar()
  const remove = useRemoveAvatar()
  const [error, setError] = useState<string | null>(null)

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(null)
    if (!AVATAR_TYPES.some((type) => type === file.type)) {
      setError('Envie uma imagem PNG, JPG ou WebP.')
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setError('A imagem passa de 512 KB.')
      return
    }
    upload.mutate(await readAsDataUrl(file), {
      onSuccess: () => toast.success('Avatar atualizado.'),
      onError: (raw) => {
        const apiError = toApiError(raw)
        setError(apiError.fieldErrors.avatar ?? apiError.message)
      },
    })
  }

  return (
    <div>
      <p className="mb-2 text-sm">Avatar</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt="Seu avatar atual"
            className="size-14 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            role="img"
            aria-label="Sem avatar"
            className="bg-secondary text-primary flex size-14 shrink-0 items-center justify-center rounded-full"
          >
            <ImageIcon className="size-5" aria-hidden="true" />
          </span>
        )}
        <input
          ref={input}
          type="file"
          accept={AVATAR_TYPES.join(',')}
          onChange={choose}
          className="sr-only"
          tabIndex={-1}
          aria-label="Escolher imagem de avatar"
        />
        <Button
          type="button"
          onClick={() => input.current?.click()}
          disabled={upload.isPending}
          aria-describedby={error ? errorId : undefined}
        >
          {upload.isPending ? 'Enviando…' : 'Alterar'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={!profile.avatarUrl || remove.isPending}
          onClick={() =>
            remove.mutate(undefined, {
              onSuccess: () => toast.success('Avatar removido.'),
              onError: (raw) => setError(toApiError(raw).message),
            })
          }
        >
          Remover
        </Button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-destructive mt-2 text-xs">
          {error}
        </p>
      )}
    </div>
  )
}
