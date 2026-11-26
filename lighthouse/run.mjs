// Roda 3 medições por página e perfil sobre o build otimizado e calcula a mediana.
// Uso: pnpm lighthouse   (ou LIGHTHOUSE_URL=https://… pnpm lighthouse para a versão publicada)
import { spawn, spawnSync } from 'node:child_process'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'
import { BASE_URL, CATEGORIES, PAGES, PROFILES, REMOTE_URL, RUNS, TARGETS } from './config.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const reportsDir = fileURLToPath(new URL('./reports/', import.meta.url))
const viteBin = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))

function build() {
  console.log('Gerando o build otimizado…')
  const result = spawnSync('pnpm build', { cwd: root, stdio: 'inherit', shell: true })
  if (result.status !== 0) throw new Error('O build falhou.')
}

async function isUp() {
  try {
    return (await fetch(BASE_URL)).ok
  } catch {
    return false
  }
}

async function startPreview() {
  if (await isUp()) {
    throw new Error(`Já existe um servidor em ${BASE_URL}. Encerre-o antes de auditar.`)
  }
  const server = spawn(process.execPath, [viteBin, 'preview', '--port', '4173', '--strictPort'], {
    cwd: root,
    stdio: 'ignore',
  })
  for (let attempt = 0; attempt < 60; attempt++) {
    if (await isUp()) return server
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  server.kill()
  throw new Error('O preview não respondeu.')
}

/** Cada medição usa um Chrome novo: perfil limpo, mock no cenário padrão. */
async function measure(url, config) {
  const chrome = await launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ['--headless=new', '--no-first-run'],
  })
  try {
    return await lighthouse(
      url,
      {
        port: chrome.port,
        output: ['html', 'json'],
        onlyCategories: CATEGORIES,
        logLevel: 'error',
      },
      config,
    )
  } finally {
    try {
      await chrome.kill()
    } catch {
      // no Windows a pasta temporária do Chrome às vezes segue ocupada; não afeta o resultado
    }
  }
}

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]

const metricsOf = (lhr) => ({
  scores: Object.fromEntries(
    CATEGORIES.map((id) => [id, Math.round(lhr.categories[id].score * 100)]),
  ),
  lcp: lhr.audits['largest-contentful-paint'].numericValue,
  cls: lhr.audits['cumulative-layout-shift'].numericValue,
  tbt: lhr.audits['total-blocking-time'].numericValue,
})

/** Auditorias que reprovaram: servem para explicar resultados abaixo da meta. */
function failedAudits(lhr) {
  return CATEGORIES.flatMap((category) =>
    lhr.categories[category].auditRefs
      .filter((ref) => ref.weight > 0)
      .map((ref) => lhr.audits[ref.id])
      .filter((audit) => audit.score !== null && audit.score < 0.9)
      .map(
        (audit) =>
          `${category}: ${audit.title}${audit.displayValue ? ` (${audit.displayValue})` : ''}`,
      ),
  )
}

function summarize(results, environment) {
  const lines = [
    '# Resultados do Lighthouse',
    '',
    'Gerado por `pnpm lighthouse`. Cada linha é a **mediana de 3 medições** por categoria.',
    '',
    '## Ambiente',
    '',
    ...Object.entries(environment).map(([key, value]) => `- ${key}: ${value}`),
    '',
    `Metas: ${CATEGORIES.map((c) => `${c} ≥ ${TARGETS[c]}`).join(', ')}.`,
    '',
    '## Medianas',
    '',
    '| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const result of results) {
    const cell = (id) => `${result.scores[id]}${result.scores[id] >= TARGETS[id] ? '' : ' ⚠️'}`
    lines.push(
      `| ${result.page} | ${result.profile} | ${CATEGORIES.map(cell).join(' | ')} | ${(result.lcp / 1000).toFixed(2)} s | ${result.cls.toFixed(3)} | ${Math.round(result.tbt)} ms |`,
    )
  }
  lines.push('', '## Medições individuais', '')
  for (const result of results) {
    lines.push(
      `- ${result.page} / ${result.profile}: ${result.runs
        .map(
          (run) =>
            `perf ${run.scores.performance}, LCP ${(run.lcp / 1000).toFixed(2)} s, TBT ${Math.round(run.tbt)} ms`,
        )
        .join(' · ')}`,
    )
  }
  lines.push('', '## Auditorias abaixo de 0,9 (na medição mediana de performance)', '')
  for (const result of results) {
    lines.push(`### ${result.page} / ${result.profile}`, '')
    lines.push(...(result.failed.length ? result.failed.map((f) => `- ${f}`) : ['- nenhuma']), '')
  }
  return lines.join('\n')
}

const skipBuild = process.argv.includes('--skip-build') || Boolean(REMOTE_URL)
if (!skipBuild) build()

await rm(reportsDir, { recursive: true, force: true })
await mkdir(reportsDir, { recursive: true })
const server = REMOTE_URL ? null : await startPreview()
const results = []
let lighthouseVersion = ''
let userAgent = ''

try {
  for (const page of PAGES) {
    for (const [profile, config] of Object.entries(PROFILES)) {
      const runs = []
      for (let run = 1; run <= RUNS; run++) {
        const { lhr, report } = await measure(`${BASE_URL}${page.path}`, config)
        if (lhr.runtimeError) throw new Error(lhr.runtimeError.message)
        lighthouseVersion = lhr.lighthouseVersion
        userAgent = lhr.environment.hostUserAgent
        const name = `${page.id}-${profile}-${run}`
        await writeFile(`${reportsDir}${name}.html`, report[0])
        await writeFile(`${reportsDir}${name}.json`, report[1])
        runs.push({ ...metricsOf(lhr), failed: failedAudits(lhr) })
        console.log(name, JSON.stringify(runs.at(-1).scores))
      }
      const middle = [...runs].sort((a, b) => a.scores.performance - b.scores.performance)[1]
      results.push({
        page: page.id,
        profile,
        scores: Object.fromEntries(
          CATEGORIES.map((id) => [id, median(runs.map((run) => run.scores[id]))]),
        ),
        lcp: median(runs.map((run) => run.lcp)),
        cls: median(runs.map((run) => run.cls)),
        tbt: median(runs.map((run) => run.tbt)),
        failed: middle.failed,
        runs,
      })
    }
  }
} finally {
  server?.kill()
}

const { version } = JSON.parse(
  await readFile(new URL('../node_modules/vite/package.json', import.meta.url), 'utf8'),
)
const environment = {
  Data: new Date().toISOString(),
  Lighthouse: lighthouseVersion,
  Navegador: userAgent,
  Node: process.version,
  Vite: version,
  Sistema: `${os.type()} ${os.release()} (${os.arch()})`,
  CPU: `${os.cpus()[0]?.model.trim()} x${os.cpus().length}`,
  Memória: `${Math.round(os.totalmem() / 1024 ** 3)} GB`,
  Alvo: BASE_URL,
  Condições: `${
    REMOTE_URL ? 'versão publicada' : 'build de produção servido por `vite preview` local (gzip)'
  }, mocks no cenário default, cache vazio, throttling simulado padrão do Lighthouse`,
}

await writeFile(`${reportsDir}median.json`, JSON.stringify({ environment, results }, null, 2))
await writeFile(
  fileURLToPath(new URL('./summary.md', import.meta.url)),
  summarize(results, environment),
)
console.log('\nResumo em lighthouse/summary.md e relatórios em lighthouse/reports/')
