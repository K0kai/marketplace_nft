# Kurio · NFT Marketplace

Marketplace de NFTs em React + TypeScript: descoberta, compra e área do colecionador, no desktop e
no celular. **API, autenticação, carteiras, pagamentos e blockchain são simulados** no navegador
com MSW; o tempo real passa pelo `socket.io-client`.

- Repositório: _preencher após publicar_
- Demonstração: _preencher após o deploy_
- Arquitetura, limitações e desvios do Figma: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Contratos REST e eventos: [`docs/CONTRACTS.md`](docs/CONTRACTS.md)

**Stack:** React 19, TypeScript, TanStack Router e Query, Axios, Socket.IO, Tailwind CSS 4,
shadcn/ui, MSW, Zod, react-hook-form, Vite, Playwright e Lighthouse.

## Como rodar

Requisitos: **Node 22.18 ou mais novo** (desenvolvido no 24) e **pnpm** (desenvolvido no 12.8.1).
Nenhum serviço externo ou chave é necessário.

```bash
pnpm install
pnpm dev:mocks        # http://localhost:5173
```

Para a versão otimizada:

```bash
pnpm build
pnpm preview          # http://localhost:4173
```

## Comandos

| Comando                   | O que faz                                                      |
| ------------------------- | -------------------------------------------------------------- |
| `pnpm dev:mocks`          | desenvolvimento com a API simulada                             |
| `pnpm dev`                | desenvolvimento sem mocks (precisa de uma API real)            |
| `pnpm build`              | checa tipos e gera o build de demonstração (com mocks)         |
| `pnpm preview`            | serve o build                                                  |
| `pnpm typecheck`          | TypeScript                                                     |
| `pnpm lint`               | ESLint                                                         |
| `pnpm format`             | Prettier                                                       |
| `pnpm test:unit`          | regras puras: ETH, domínio do mock, filtro de eventos          |
| `pnpm test:e2e`           | Playwright, desktop e mobile                                   |
| `pnpm test:visual`        | regressão visual                                               |
| `pnpm test:visual:update` | recria as baselines                                            |
| `pnpm test:report`        | abre o relatório HTML do Playwright                            |
| `pnpm lighthouse`         | gera o build, mede e escreve `lighthouse/summary.md`           |
| `pnpm assets`             | recorta as artes dos frames (precisa da pasta local `design/`) |

## Variáveis de ambiente

Modelo em [`.env.example`](.env.example). O modo `mocks`, usado por `dev:mocks` e `build`, lê
`.env.mocks`.

| Variável              | Padrão em `.env.mocks` | Descrição                                    |
| --------------------- | ---------------------- | -------------------------------------------- |
| `VITE_ENABLE_MOCKS`   | `true`                 | liga o MSW (REST e Socket.IO)                |
| `VITE_API_URL`        | vazio                  | base da API; vazio usa a mesma origem        |
| `VITE_SOCKET_URL`     | vazio                  | servidor Socket.IO; vazio usa a mesma origem |
| `VITE_API_TIMEOUT_MS` | `8000`                 | timeout das requisições                      |

## Dados de teste (fictícios)

| Conta       | E-mail            | Senha            | Situação inicial                                |
| ----------- | ----------------- | ---------------- | ----------------------------------------------- |
| Nova Sato   | `nova@kurio.test` | `Kurio@2026`     | duas carteiras, dois favoritos                  |
| Leo Martins | `leo@kurio.test`  | `Colecionador@1` | uma carteira, um favorito, um pedido confirmado |

| Cupom           | Efeito   |
| --------------- | -------- |
| `KURIO10`       | 10%      |
| `COLECIONADOR5` | 5%       |
| `GENESIS2025`   | expirado |

Úteis para testar:

- `Emerald Ape #042` (`/nft/emerald-ape-042`): edição 1/1 esgotada.
- `/orders/order-leo-seed` logado como Nova: acesso negado (403).
- Nomes de usuário `admin`, `kurio` e `suporte`: recusados pela API.

## Cenários simulados

**Escolher:** `?scenario=<nome>` na URL, página [`/demo`](http://localhost:4173/demo) ou
`POST /__mock/scenario`.

**Restaurar:** `?reset=1` (ou `?reset=1&scenario=<nome>`), botão "Restaurar tudo" em `/demo` ou
`POST /__mock/reset`. A restauração volta os dados ao estado inicial e invalida as sessões.

O cenário **fica ativo** até ser trocado. Os que disparam uma única vez (`price-changed`,
`sold-out`, `order-timeout`) são rearmados ao trocar de cenário ou com `?reset=1&scenario=…`.

| Cenário             | Comportamento                               |
| ------------------- | ------------------------------------------- |
| `default`           | tudo funciona, latência fixa de 120 ms      |
| `empty-catalog`     | catálogo vazio                              |
| `slow`              | 2,5 s em todas as respostas                 |
| `variable-latency`  | 100 ms a 1,6 s, com seed fixa               |
| `out-of-order`      | buscas alternam lentas e rápidas            |
| `offline`           | todas as requisições falham sem resposta    |
| `server-error`      | consultas respondem 500                     |
| `catalog-error`     | só o catálogo responde 503                  |
| `flaky`             | a primeira chamada de cada consulta falha   |
| `short-session`     | sessão vence em 60 s                        |
| `favorite-failure`  | favoritar responde 500                      |
| `register-conflict` | todo cadastro responde 409                  |
| `price-changed`     | o preço sobe no envio do pedido             |
| `sold-out`          | a edição esgota no envio do pedido          |
| `order-timeout`     | o pedido é criado, mas a resposta não chega |
| `payment-declined`  | pagamento recusado                          |
| `payment-pending`   | fica pendente até ser liquidado             |
| `wallet-rejected`   | a carteira recusa a conexão                 |

## Como reproduzir os fluxos de falha

Para a compra: entre como Nova, adicione um NFT, vá ao pagamento, clique em **Conectar carteira**,
**Confirmar compra** e **Enviar pedido**.

| Quero ver                     | Passos                                                                                      | Esperado                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Atualização otimista desfeita | `/?scenario=favorite-failure`, entre e favorite um NFT                                      | o coração marca, volta e um aviso explica      |
| Preço muda na revisão         | abra a revisão e mude o preço pelo console (comandos abaixo)                                | envio bloqueado até aceitar os novos valores   |
| Cotação recusada no envio     | `/?reset=1&scenario=price-changed` e compre                                                 | nenhum pedido criado; pede nova confirmação    |
| Esgotou no checkout           | `/?reset=1&scenario=sold-out` e compre                                                      | compra bloqueada                               |
| Timeout com recuperação       | `/?reset=1&scenario=order-timeout` e compre; aguarde 8 s                                    | "Verificar pedido" abre o mesmo pedido         |
| Timeout seguido de refresh    | o mesmo, recarregando antes dos 8 s                                                         | "Recuperar pedido" ou "Acompanhar pedido"      |
| Pagamento recusado            | `/?scenario=payment-declined` e compre                                                      | pedido recusado, carrinho preservado           |
| Pendente e queda de conexão   | `/?scenario=payment-pending`, compre; na tela do pedido, rode os comandos de queda abaixo   | o estado é recuperado sem nova compra          |
| Pendente e refresh            | o mesmo, recarregando a página; depois liquide em `/demo`                                   | o pedido continua e depois aparece o resultado |
| Carteira recusada             | `/?scenario=wallet-rejected` e conecte                                                      | mensagem de recusa                             |
| Sessão expirada               | `/?scenario=short-session`, entre, espere 60 s e navegue; ou em `/demo`, "Expirar a sessão" | volta ao login e retoma o destino              |
| Cupom inválido ou expirado    | no carrinho, `XYZ` ou `GENESIS2025`                                                         | erro no campo                                  |

**Mudanças ao vivo com a tela aberta:** cada aba tem a própria simulação, e um evento só chega à
aba que o gerou. Por isso, para mudar o preço **com o carrinho ou a revisão abertos**, chame o
controle pelo console do navegador **na mesma aba** (DevTools):

```js
const mock = (path, body) =>
  fetch(`/__mock/${path}`, { method: 'POST', body: JSON.stringify(body) })

// mudar preço ou esgotar uma edição
await mock('nfts/emerald-ape-042', { price: '1.5' })
await mock('nfts/emerald-ape-042', { editions: { '1-50': 0 } })

// queda de conexão com o pedido pendente (o id está na URL /orders/<id>)
const orderId = location.pathname.split('/').pop()
await mock('socket', { action: 'offline' })
await mock(`orders/${orderId}/settle`, { outcome: 'confirmed' })
await mock('socket', { action: 'online' })
```

## Testes

```bash
pnpm exec playwright install chromium   # uma vez
pnpm test:unit
pnpm test:e2e
pnpm test:visual
pnpm test:report
```

O Playwright gera o build e sobe o preview sozinho. Fora de CI, ele reaproveita um servidor que
já esteja na porta 4173: **encerre previews antigos** para não testar um build desatualizado.

São 48 testes E2E em cada um dos dois projetos (desktop 1440×900 e mobile 390×844):

| Arquivo                    | Cobre                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| `01-catalogo`              | busca, filtros combinados, ordenação, paginação, histórico, respostas fora de ordem, vazio |
| `02-detalhe`               | acesso direto, inexistente, edição esgotada, limite                                        |
| `03-sessao`                | cadastro, login, expiração (relógio e checkout), logout, troca de usuário, 403             |
| `04-favoritos`             | persistência, falha com rollback                                                           |
| `05-carrinho`              | quantidade, remoção, cupom, refresh e login                                                |
| `06-compra`                | do catálogo ao recibo                                                                      |
| `07-falhas-pagamento`      | recusa, cliques repetidos, timeout, idempotência, carteira                                 |
| `08-conta`                 | perfil, avatar, senha, carteiras                                                           |
| `09-tempo-real-checkout`   | preço e estoque mudando durante a compra                                                   |
| `10-eventos-reconexao`     | duplicados, antigos, queda do socket, outra conta                                          |
| `11-acessibilidade`        | teclado, foco, formulários, axe                                                            |
| `12-carregamento-e-falhas` | skeletons, movimento reduzido, erros e nova tentativa                                      |

Cada teste começa num contexto novo (mock no estado inicial). O bastidor é controlado só por HTTP:
o REST passa pelos handlers e os eventos chegam pelo `socket.io-client`. Qualquer exceção não
tratada na página reprova o teste. Falhas guardam trace e captura de tela.

**Regressão visual:** início, detalhe, carrinho e pagamento. As baselines em
`tests/visual/__screenshots__/` foram geradas no **Windows**. Em outro sistema, rode
`pnpm test:visual:update` antes de comparar.

## Lighthouse

```bash
pnpm lighthouse                                       # build local
LIGHTHOUSE_URL=https://sua-url pnpm lighthouse        # versão publicada
```

No PowerShell: `$env:LIGHTHOUSE_URL='https://sua-url'; pnpm lighthouse`.
Encerre qualquer servidor na porta 4173 antes da medição local. A configuração está em
`lighthouse/config.mjs`; o resumo, com ambiente, LCP, CLS e TBT, em
[`lighthouse/summary.md`](lighthouse/summary.md); os relatórios, em `lighthouse/reports/`.

A performance no mobile ficou abaixo da meta de 90. As causas estão em
[`ARCHITECTURE.md`](ARCHITECTURE.md#meta-não-atingida-performance-no-mobile-meta-90).

## Deploy (Vercel)

[`vercel.json`](vercel.json) já define build, saída, reescrita para SPA (acesso direto e refresh
em qualquer rota) e cache. A demonstração usa os mocks, então não há variável secreta.

1. Publique o repositório no GitHub.
2. Na Vercel, **Add New → Project**, importe o repositório e mantenha as configurações do arquivo.
3. Em **Environment Variables**, crie `ENABLE_EXPERIMENTAL_COREPACK=1`, para a Vercel usar a
   versão do pnpm declarada em `package.json`.
4. Faça o deploy e confira: acesso direto a `/nft/emerald-ape-042`, `/cart` e `/checkout`;
   o aviso de preço ao vivo; e uma compra completa.

## Estrutura

```
src/
  api/          contratos Zod, Axios, endpoints, chaves de cache
  app/          QueryClient, router, ciclo de vida da sessão
  routes/       rotas por arquivo
  features/     catálogo, NFT, carrinho, checkout, pedidos, conta, auth, favoritos
  components/   compartilhados e ui/ (shadcn adaptado)
  realtime/     socket, filtro e aplicação de eventos
  mocks/        MSW: handlers, domínio, banco, fixtures, cenários, Socket.IO
tests/          unit/, e2e/, visual/, support/
lighthouse/     configuração, script e relatórios
```

## Licença

Todos os direitos reservados. O código pode ser acessado e executado apenas para avaliar a
candidatura. Veja [LICENSE](LICENSE), que também trata dos materiais de terceiros e do desafio.
