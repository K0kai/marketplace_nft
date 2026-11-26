// Armazenamento pode lançar (aba privada, cota cheia); a UI não pode quebrar por isso.

export function readJson<T>(key: string, area: () => Storage = () => localStorage): T | null {
  try {
    const raw = area().getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeJson(key: string, value: unknown, area: () => Storage = () => localStorage) {
  try {
    if (value === null || value === undefined) area().removeItem(key)
    else area().setItem(key, JSON.stringify(value))
  } catch {
    // sem persistência: a sessão atual continua funcionando em memória
  }
}
