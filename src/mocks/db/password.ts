// PBKDF2 via WebCrypto: o "banco" do mock nunca guarda a senha em texto puro.

const ITERATIONS = 10_000

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: ITERATIONS },
    key,
    256,
  )
  return toHex(new Uint8Array(bits))
}

export function randomSalt(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)))
}
