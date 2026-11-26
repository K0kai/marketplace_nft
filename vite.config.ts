import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * Com os mocks ligados, o app só busca dados depois do chunk do MSW. O preload faz o
 * navegador baixá-lo junto com o app, em vez de descobri-lo só quando o JS roda.
 */
function preloadMockServer(): Plugin {
  return {
    name: 'preload-mock-server',
    transformIndexHtml: {
      order: 'post',
      handler(_html, { bundle }) {
        const chunk = Object.values(bundle ?? {}).find(
          (item) => item.type === 'chunk' && item.facadeModuleId?.endsWith('/mocks/browser.ts'),
        )
        // sem mocks o chunk nem existe no build
        if (!chunk) return []
        return [
          {
            tag: 'link',
            attrs: { rel: 'modulepreload', crossorigin: true, href: `/${chunk.fileName}` },
            injectTo: 'head',
          },
        ]
      },
    },
  }
}

/** O CSS é pequeno (cerca de 12 kB comprimido): embutido no HTML, não segura a primeira pintura. */
function inlineStyles(): Plugin {
  return {
    name: 'inline-styles',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, { bundle }) {
        let result = html
        for (const [fileName, asset] of Object.entries(bundle ?? {})) {
          if (asset.type !== 'asset' || !fileName.endsWith('.css')) continue
          const link = new RegExp(`<link rel="stylesheet"[^>]*href="/${fileName}"[^>]*>`)
          if (!link.test(result)) continue
          result = result.replace(link, () => `<style>${String(asset.source)}</style>`)
        }
        return result
      },
    },
  }
}

export default defineConfig({
  plugins: [
    // o plugin do router precisa vir antes do react
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    preloadMockServer(),
    inlineStyles(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // ver o comentário no próprio arquivo
      tldts: fileURLToPath(new URL('./src/mocks/stubs/tldts.ts', import.meta.url)),
    },
  },
  server: { port: 5173 },
})
