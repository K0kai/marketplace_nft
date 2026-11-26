/** Só aceita caminhos internos: evita que ?redirect= mande o usuário para outro site. */
export function safeRedirect(target: string | undefined): string {
  if (!target || !target.startsWith('/') || target.startsWith('//')) return '/'
  return /^\/(login|register)(\?|$)/.test(target) ? '/' : target
}
