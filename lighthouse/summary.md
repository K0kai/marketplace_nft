# Resultados do Lighthouse

Gerado por `pnpm lighthouse`. Cada linha é a **mediana de 3 medições** por categoria.

## Ambiente

- Data: 2026-11-26T18:42:15.316Z
- Lighthouse: 13.6.0
- Navegador: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/159.0.0.0 Safari/537.36
- Node: v24.15.0
- Vite: 8.3.8
- Sistema: Windows_NT 10.0.26200 (x64)
- CPU: AMD Ryzen 5 5600X 6-Core Processor x12
- Memória: 32 GB
- Alvo: http://localhost:4173
- Condições: build de produção servido por `vite preview` local (gzip), mocks no cenário default, cache vazio, throttling simulado padrão do Lighthouse

Metas: performance ≥ 90, accessibility ≥ 95, best-practices ≥ 95, seo ≥ 90.

## Medianas

| Página  | Perfil  | Performance | Acessibilidade | Boas práticas | SEO | LCP    | CLS   | TBT    |
| ------- | ------- | ----------- | -------------- | ------------- | --- | ------ | ----- | ------ |
| inicio  | mobile  | 85 ⚠️       | 100            | 100           | 100 | 3.74 s | 0.000 | 231 ms |
| inicio  | desktop | 99          | 100            | 100           | 100 | 0.84 s | 0.000 | 0 ms   |
| detalhe | mobile  | 88 ⚠️       | 100            | 100           | 100 | 3.60 s | 0.000 | 168 ms |
| detalhe | desktop | 100         | 100            | 100           | 100 | 0.79 s | 0.000 | 0 ms   |

## Medições individuais

- inicio / mobile: perf 86, LCP 3.81 s, TBT 184 ms · perf 84, LCP 3.74 s, TBT 259 ms · perf 85, LCP 3.73 s, TBT 231 ms
- inicio / desktop: perf 99, LCP 0.84 s, TBT 0 ms · perf 99, LCP 0.84 s, TBT 0 ms · perf 99, LCP 0.83 s, TBT 0 ms
- detalhe / mobile: perf 88, LCP 3.60 s, TBT 139 ms · perf 88, LCP 3.60 s, TBT 168 ms · perf 87, LCP 3.68 s, TBT 191 ms
- detalhe / desktop: perf 100, LCP 0.79 s, TBT 0 ms · perf 100, LCP 0.79 s, TBT 0 ms · perf 100, LCP 0.79 s, TBT 0 ms

## Auditorias abaixo de 0,9 (na medição mediana de performance)

### inicio / mobile

- performance: Largest Contentful Paint (3.7 s)
- performance: Total Blocking Time (230 ms)

### inicio / desktop

- nenhuma

### detalhe / mobile

- performance: Largest Contentful Paint (3.6 s)

### detalhe / desktop

- nenhuma
