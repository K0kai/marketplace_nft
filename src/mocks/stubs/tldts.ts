// O MSW traz o tough-cookie, que embute a lista pública de sufixos (tldts) só para validar
// o domínio de cookies. Nossa API usa Bearer token, sem cookies: este substituto tira
// cerca de um terço do chunk do mock. Vale para todos os builds (alias no vite.config).
export function getDomain(host: string): string | null {
  const labels = host.split('.')
  return labels.length > 1 ? labels.slice(-2).join('.') : null
}
