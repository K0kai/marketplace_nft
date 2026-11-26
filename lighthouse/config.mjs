// Configuração da auditoria. Mudanças aqui ficam registradas no histórico do projeto.
import { desktopConfig } from 'lighthouse'

// LIGHTHOUSE_URL audita uma versão já publicada; sem ela, o build é gerado e servido localmente
export const REMOTE_URL = process.env.LIGHTHOUSE_URL?.replace(/\/$/, '')
export const BASE_URL = REMOTE_URL ?? 'http://localhost:4173'
export const RUNS = 3

export const PAGES = [
  { id: 'inicio', path: '/' },
  { id: 'detalhe', path: '/nft/emerald-ape-042' },
]

export const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']

export const TARGETS = {
  performance: 90,
  accessibility: 95,
  'best-practices': 95,
  seo: 90,
}

// Perfis padrão do próprio Lighthouse, sem nenhum atalho:
// mobile = Moto G Power com 4G lento e CPU 4x mais lenta (simulados); desktop = preset oficial.
export const PROFILES = {
  mobile: undefined,
  desktop: desktopConfig,
}
