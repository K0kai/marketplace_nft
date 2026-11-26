# Resultados do Lighthouse

Gerado por `pnpm lighthouse`. Cada linha é a **mediana de 3 medições** por categoria.

## Ambiente

- Data: 2026-11-26T20:00:32.088Z
- Lighthouse: 13.6.0
- Navegador: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/159.0.0.0 Safari/537.36
- Node: v24.15.0
- Vite: 8.3.8
- Sistema: Windows_NT 10.0.26200 (x64)
- CPU: AMD Ryzen 5 5600X 6-Core Processor x12
- Memória: 32 GB
- Alvo: https://kurio-marketplace-nft-six.vercel.app
- Condições: versão publicada, mocks no cenário default, cache vazio, throttling simulado padrão do Lighthouse

Metas: performance ≥ 90, accessibility ≥ 95, best-practices ≥ 95, seo ≥ 90.

## Medianas

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| inicio | mobile | 93 | 100 | 100 | 100 | 2.72 s | 0.013 | 199 ms |
| inicio | desktop | 100 | 100 | 100 | 100 | 0.58 s | 0.000 | 0 ms |
| detalhe | mobile | 96 | 100 | 100 | 100 | 2.51 s | 0.000 | 143 ms |
| detalhe | desktop | 100 | 100 | 100 | 100 | 0.54 s | 0.000 | 0 ms |

## Medições individuais

- inicio / mobile: perf 93, LCP 2.72 s, TBT 206 ms · perf 94, LCP 2.72 s, TBT 189 ms · perf 93, LCP 2.71 s, TBT 199 ms
- inicio / desktop: perf 100, LCP 0.58 s, TBT 0 ms · perf 100, LCP 0.59 s, TBT 0 ms · perf 100, LCP 0.58 s, TBT 0 ms
- detalhe / mobile: perf 96, LCP 2.52 s, TBT 113 ms · perf 94, LCP 2.51 s, TBT 193 ms · perf 96, LCP 2.51 s, TBT 143 ms
- detalhe / desktop: perf 100, LCP 0.54 s, TBT 0 ms · perf 100, LCP 0.54 s, TBT 0 ms · perf 100, LCP 0.54 s, TBT 0 ms

## Auditorias abaixo de 0,9 (na medição mediana de performance)

### inicio / mobile

- performance: Largest Contentful Paint (2.7 s)

### inicio / desktop

- nenhuma

### detalhe / mobile

- performance: Largest Contentful Paint (2.5 s)

### detalhe / desktop

- nenhuma
