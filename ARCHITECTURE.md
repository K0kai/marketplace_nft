# Arquitetura

Decisões, políticas, limitações e desvios do Figma. Os contratos estão em
[`docs/CONTRACTS.md`](docs/CONTRACTS.md).

## Visão geral

```
┌──────────────────────────── navegador ────────────────────────────┐
│ routes/ (TanStack Router) → features/ (telas e hooks)             │
│                                  │                                │
│                       TanStack Query (cache)                      │
│                    ┌─────────────┴──────────────┐                 │
│              api/ (Axios + Zod)        realtime/ (socket.io-client)│
│                    │ HTTP                        │ WebSocket       │
│   ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ camada de rede ─ │─ ─ ─ ─ ─ ─ ─ ─  │
│              mocks/ (MSW): handlers REST + binding Socket.IO      │
│                    domain/ (regras) → db/ (localStorage)          │
└───────────────────────────────────────────────────────────────────┘
```

A linha tracejada é a fronteira. Nada acima dela importa `mocks/` (a única ligação é o
`import()` condicional em `main.tsx`). Com `VITE_ENABLE_MOCKS` desligado, o chunk do mock nem
entra no build, e o app passa a falar com `VITE_API_URL` e `VITE_SOCKET_URL`.
A página `/demo` controla a simulação apenas por HTTP (`/__mock/*`), como os testes.

| Pasta                    | Responsabilidade                                                |
| ------------------------ | --------------------------------------------------------------- |
| `src/api`                | contratos Zod, cliente Axios, erros, endpoints, chaves de cache |
| `src/app`                | QueryClient, router e ciclo de vida da sessão                   |
| `src/routes`             | rotas por arquivo: URL → tela                                   |
| `src/features/<domínio>` | telas e hooks de cada domínio                                   |
| `src/components`         | peças compartilhadas; `ui/` é o shadcn/ui adaptado ao tema      |
| `src/realtime`           | conexão, filtro de eventos e aplicação no cache                 |
| `src/lib`                | utilitários puros (ETH, storage, store)                         |
| `src/mocks`              | servidor simulado                                               |

## Onde cada estado mora

| Estado                                              | Dono                             | Motivo                                                     |
| --------------------------------------------------- | -------------------------------- | ---------------------------------------------------------- |
| Busca, filtros, ordenação, página, edição escolhida | **URL**                          | sobrevive a refresh, histórico e compartilhamento          |
| Dados do servidor                                   | **TanStack Query**               | cache, invalidação, cancelamento                           |
| Sessão (token e userId)                             | `session-store` + `localStorage` | precisa existir fora do React (interceptor, guard, socket) |
| Rascunho do checkout e tentativa de pedido          | `sessionStorage`, por usuário    | recuperar depois de refresh ou expiração                   |
| Avisos do carrinho e estado da conexão              | store mínimo (`lib/store.ts`)    | não vêm do REST                                            |
| Formulários                                         | react-hook-form + Zod            | os mesmos schemas do contrato                              |

Não há biblioteca de estado global: depois da URL e do Query, sobra pouco.

## Rotas

- Rotas por arquivo, com divisão de código automática.
- `_auth.tsx` é um layout sem caminho: o `beforeLoad` redireciona para `/login?redirect=…`.
- `redirect` só aceita caminhos internos (evita redirecionamento aberto).
- A URL usa `URLSearchParams` comum (`?category=music&page=2`) em vez do JSON padrão do router.
- Parâmetro inválido é ignorado (`.catch(undefined)`), não derruba a página.
- Mudar qualquer filtro remove `page`.
- `login` e `register`: diálogo sobre o início no desktop, página inteira no celular.
- A cada troca de página o foco vai para o `<main>`.

## Cache, retry e sincronização

| Consulta              | `staleTime` | Observação                                                           |
| --------------------- | ----------- | -------------------------------------------------------------------- |
| padrão                | 30 s        | `gcTime` de 5 min                                                    |
| destaques             | 5 min       | mudam pouco                                                          |
| cotação               | 0           | sempre revalidada; fica sob a chave do carrinho                      |
| pedidos pendentes     | 0           | decide se a compra fica bloqueada                                    |
| pedido                | 30 s        | consulta a cada 5 s enquanto `pending` (rede de segurança do socket) |
| verificação de sessão | 60 s        | confirma o token depois de um refresh                                |

**Chaves.** Dados públicos ficam sob `['nfts', …]`; privados sob `['user', userId, …]`; o
carrinho do visitante sob `['guest', 'cart']`. Parâmetros de busca fazem parte da chave. A cotação
é filha do carrinho, então invalidar o carrinho invalida a cotação.

**Retry.** Consultas repetem até 2 vezes, só em falha transitória e **não em timeout** (somaria
mais de 20 s de tela presa), com espera de `min(500 · 2^n, 4000)` ms. Mutations **nunca** repetem
sozinhas: reenviar uma compra é decisão do usuário.

**Respostas fora de ordem.** O `signal` do Query chega ao Axios: trocar de filtro cancela a
requisição anterior. Mesmo sem cancelamento, cada resposta só grava na própria chave.
`keepPreviousData` mantém a lista na tela, com indicação de atualização.

**Invalidação.** Mutations do carrinho gravam a resposta no cache, cancelam leituras em voo e
invalidam a cotação; são executadas em série (`scope`). Em erro, o carrinho é buscado de novo.

**Atualização otimista (favoritos).** `onMutate` cancela leituras, guarda o estado anterior e
muda o coração na hora; `onError` restaura e avisa que a alteração foi desfeita; `onSettled`
revalida. Também em série, para cliques rápidos não se atropelarem.

## Sessão

- Token opaco, validade de 8 h (60 s no cenário `short-session`). Não há refresh token.
- No `localStorage` ficam só `{ token, userId }`. É a opção possível para uma API simulada no
  próprio navegador; com backend real, o recomendado é cookie `HttpOnly`.
- Senhas: o "banco" do mock guarda PBKDF2-SHA-256 com salt, nunca o texto.
- Expiração: o interceptor encerra a sessão apenas se o `401 SESSION_EXPIRED` veio **do token
  atual** (resposta atrasada de sessão antiga é ignorada).
- Login ou logout em outra aba é refletido pelo evento `storage`.

`app/session-lifecycle.ts` concentra o que acontece em cada troca, fora do React:

1. desconecta o socket e limpa o filtro de eventos;
2. limpa avisos do carrinho;
3. se o usuário mudou: cancela e **remove** as consultas de `['user', anterior]` e limpa o cache
   de mutations;
4. remove o carrinho de visitante do cache;
5. no logout, apaga rascunho e tentativa de pedido; na **expiração, mantém**, para retomar;
6. reavalia os guards e abre o socket da nova sessão.

## Carrinho

- Vive no servidor (mock), identificado pela conta ou pelo `X-Guest-Id`; por isso persiste.
- No login ou cadastro, o carrinho do visitante é somado ao da conta, limitado ao estoque.
  Item que esgotou **não some**: fica marcado, e o usuário decide.
- A interface não calcula totais: mostra os da cotação.
- ETH é somado em wei com `bigint` (`lib/eth.ts`); `number` não aparece em contas de dinheiro.

## Compra

### Cotação aceita

O `quoteId` é um hash do conteúdo. `use-accepted-quote.ts` guarda a cotação que o usuário viu:

- mudança **feita por ele** (rede, cupom) é aceita automaticamente;
- mudança **vinda do servidor** deixa a cotação velha: o envio é bloqueado até clicar em
  "Aceitar novos valores".

Mesmo que o evento não chegue, o servidor revalida e responde `409 QUOTE_STALE`.

### Sem pedido duplicado

1. Trava síncrona (`useRef`): vários cliques no mesmo instante geram uma requisição.
2. A tentativa `{ chave, corpo }` é gravada em `sessionStorage` **antes** do envio.
3. Resposta inconclusiva (rede, timeout, 5xx ou sessão expirada) preserva a tentativa;
   "Verificar pedido" ou "Recuperar pedido" reenviam a **mesma chave e o mesmo corpo**.
4. Resposta conclusiva (sucesso ou erro de negócio) descarta a tentativa.
5. O servidor ainda recusa um segundo pedido enquanto houver um pendente.

Detalhe que os testes revelaram: o pedido sem resposta pode ser confirmado e **esvaziar o
carrinho**. A tela de pagamento continua montada enquanto houver tentativa sem resposta, para não
trocar a opção de recuperação por "carrinho vazio".

### Confirmação

`/orders/$orderId` representa `pending`, `confirmed` e `declined`. A tela de sucesso só existe
quando a API devolve `confirmed`. O recibo vem do retrato gravado no pedido.

## Tempo real: reconciliação entre REST e Socket.IO

**REST é a fonte da verdade; o evento é um aviso que chega mais cedo.**

| Situação                                | Tratamento                                                                                                                                            |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nft.updated`                           | grava o novo estado nas entradas do cache com versão menor; invalida listas (filtro e ordem podem mudar) e o carrinho/cotação, se o item estiver nele |
| Item do carrinho mudou                  | aviso na página, toast e região `aria-live`; checkout bloqueia a cotação velha                                                                        |
| `order.updated`                         | atualiza o pedido pendente; invalida pedidos e carrinho                                                                                               |
| Duplicado                               | descartado por `eventId`                                                                                                                              |
| Antigo                                  | descartado pela versão no filtro; o cache também compara versões                                                                                      |
| Antigo depois de refresh (filtro vazio) | a versão em cache e o `nftVersion` do carrinho impedem regressão e aviso falso                                                                        |
| Reconexão                               | invalida catálogo, carrinho, pedidos e favoritos: o REST repõe o que se perdeu                                                                        |
| Primeira conexão                        | revalida pedidos (um pode ter terminado antes de o socket abrir)                                                                                      |
| Socket fora do ar                       | banner "Reconectando…"; o pedido pendente é consultado a cada 5 s                                                                                     |
| Troca de sessão                         | socket antigo perde os listeners e é desconectado; evento privado de outro `userId` é descartado                                                      |

## Mocking

- Um único conjunto de handlers atende desenvolvimento, demonstração e testes.
- Camadas: `handlers/` (HTTP) → `domain/` (regras) → `db/` (estado em `localStorage`).
- `networkHandler` é o primeiro da fila: aplica latência e falhas do cenário.
- REST e eventos saem do **mesmo dado**: `updateNft` e `settleOrder` são as portas de escrita
  que gravam e publicam.
- Determinismo: fixtures e latência variável usam seed fixa; gatilhos como "o preço muda no
  primeiro envio" disparam uma única vez.
- A interface aparece de imediato; requisições e socket esperam `whenNetworkReady()`.

### Transporte do tempo real

`socket.io-client` real, com `transports: ['websocket']`, interceptado por `ws.link` do MSW e
traduzido por `@mswjs/socket.io-binding`.

Dois detalhes que custaram investigação:

- O MSW remove o prefixo `/socket.io/` e a query antes de comparar a URL; por isso o padrão
  casa só com a raiz do host. Com um padrão "óbvio", o WebSocket **escapava para a rede**.
  Conexões sem o parâmetro `EIO` (como o HMR do Vite) são repassadas ao servidor.
- O `engine.io-client` guarda o `WebSocket` global ao ser importado; por isso o
  `socket.io-client` é importado **depois** que o MSW inicia.

Limitações:

- só o transporte WebSocket (o long-polling não passa pelo MSW);
- sem salas, namespaces ou acks; o mock envia o ping do Engine.IO e lê o token do pacote CONNECT;
- cada aba tem o seu "servidor": o estado é compartilhado por `localStorage`, mas um evento só
  chega à aba que o publicou;
- o histórico de eventos se perde no refresh;
- as ferramentas do Playwright não enxergam os quadros do WebSocket interceptado; os testes
  observam o efeito na interface.

## Interface e design system

- Cores medidas nos PNGs do Figma e declaradas como variáveis em `src/index.css`.
- shadcn/ui sobre Radix, com variantes próprias (botão em pílula no celular).
- Fonte Roboto Mono local, com pré-carregamento e um fallback de mesma largura.
- Skeletons com shimmer em CSS, com as dimensões do conteúdo; sem animação com
  `prefers-reduced-motion`.
- Estados não desenhados (vazio, erro, carregando, 403, 404, pendente, recusado) seguem o mesmo
  padrão visual.
- Cabeçalho, rodapé, barra lateral e blocos editoriais **só são montados** nos tamanhos em que
  aparecem (esconder por CSS ainda baixava as imagens no celular).

## Acessibilidade

- Link "Pular para o conteúdo"; foco visível; foco levado ao conteúdo na navegação.
- Diálogos e painéis (Radix) prendem o foco, fecham com Escape e o devolvem a quem abriu.
- Campos com `label`, `aria-invalid` e erro ligado por `aria-describedby`; erros da API vão para
  o campo certo e o primeiro recebe foco.
- Mutations e eventos são anunciados (toasts e regiões `status`/`alert`).
- Estado não depende só de cor: edição esgotada é riscada e dita "(esgotada)"; filtro ativo tem
  marca e `aria-pressed`.
- Verificação automática com axe nas telas principais (`tests/e2e/11-acessibilidade.spec.ts`).
  A varredura automática não substitui um teste manual com leitor de tela, que não foi feito.

**Ajustes em relação ao layout, por acessibilidade:** borda dos campos mais clara (a original não
chega a 3:1); texto de edição esgotada sem opacidade (contraste); títulos `h2` ocultos para manter
a hierarquia.

## Desempenho

Medições e ambiente em [`lighthouse/summary.md`](lighthouse/summary.md); relatórios HTML e JSON
em `lighthouse/reports/`.

### Otimizações feitas (valem para todos os builds)

| Problema medido                                                                                                   | Solução                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Chunk do mock com 177 kB (gzip): o `tough-cookie` do MSW traz a lista de sufixos `tldts`, e o app não usa cookies | alias para um `getDomain` mínimo (`src/mocks/stubs/tldts.ts`): chunk com 61 kB |
| Chunk do mock só era pedido depois de o app executar                                                              | `modulepreload`                                                                |
| CSS bloqueando a primeira pintura                                                                                 | CSS embutido no HTML                                                           |
| Imagens de blocos ocultos baixadas no celular                                                                     | blocos montados só quando visíveis                                             |
| Menu da conta e posicionamento no bundle principal                                                                | carregados sob demanda                                                         |
| `sizes` fazia o celular baixar a imagem de 640 px nos cards                                                       | `sizes` corrigido                                                              |
| CLS de 0,127 no detalhe (rodapé empurrado)                                                                        | skeleton ocupa a altura da tela                                                |

Primeira medição → medição final: início mobile 78 → 85; detalhe mobile 80 → 88; detalhe desktop
94 → 100; CLS do detalhe desktop 0,127 → 0,000.

### Meta não atingida: performance no mobile (meta 90)

As demais metas foram atingidas nas duas páginas e nos dois perfis.

- **O que reprova:** LCP de cerca de 3,7 s (simulação de 4G lento e CPU 4× mais lenta). CLS está
  dentro do bom; o TBT varia entre execuções (cerca de 140 a 260 ms).
- **Causa:** o elemento LCP é a imagem de um NFT, que só pode ser pedida depois de: baixar e
  executar o JavaScript (React, Router, Query, Axios, Zod, Socket.IO e telas), iniciar o Service
  Worker do MSW e receber a resposta da API, que no cenário padrão tem 120 ms de latência. São
  cerca de 340 kB transferidos até o LCP.
- **Particularidade da demonstração:** o "backend" roda no navegador. O download do mock e o
  processamento das respostas disputam banda e CPU com a interface. Com um backend real esse custo
  sairia do cliente. O ganho disso **não foi medido**.
- **Próximos passos possíveis:** renderização no servidor ou pré-renderização com os dados
  iniciais (muda a arquitetura pedida); `zod/mini` nos contratos; carregar diálogos sob demanda.
- **Não foi feito** nenhum atalho só para auditoria: mesmas imagens, fontes, mocks e
  funcionalidades.
- O `vite preview` local usa gzip. A hospedagem pode usar compressão melhor; meça a versão
  publicada com `LIGHTHOUSE_URL=https://… pnpm lighthouse`.

## Decisões de UX

- **Revisão antes de enviar:** diálogo com os valores finais.
- **Carteiras cadastradas** pré-preenchem o formulário de pagamento.
- **Conexão da carteira** é um passo explícito; trocar carteira, provedor ou rede pede nova conexão.
- **Fora do escopo** nunca finge sucesso: leva a "Em breve" ou avisa que está indisponível
  (login social, newsletter, recuperação de senha).
- **Explorador de transações** é uma página interna que se declara fictícia.

## Desvios do Figma e substituições de assets

| Desvio                                                                            | Motivo                                                                               |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Artes recortadas dos próprios frames (`pnpm assets`) e reutilizadas entre os NFTs | os arquivos originais não estavam disponíveis; basta substituir os de `public/nfts/` |
| Galeria mostra quatro enquadramentos da mesma arte                                | só há uma arte por NFT                                                               |
| Detalhe no celular mantém miniaturas                                              | a galeria precisa ser operável                                                       |
| Ícone "Thank you" redesenhado em SVG; ícones do lucide-react                      | não havia exportação dos ícones                                                      |
| Carrossel do destaque não avança sozinho                                          | movimento automático atrapalha leitura e acessibilidade                              |
| No celular, a ordenação fica no painel de filtros                                 | não há espaço no frame                                                               |
| Contagens dos filtros são reais                                                   | o layout traz números ilustrativos                                                   |
| Pagamento inclui "Carteira cadastrada", estado da conexão e revisão               | exigidos pela especificação                                                          |
| Dados do colecionador recolhíveis no celular                                      | o frame móvel não mostra o formulário                                                |
| Cabeçalho, rodapé e editorial não aparecem no celular                             | como nos frames móveis                                                               |
| Telas de conta sem rodapé                                                         | como nos frames                                                                      |
| Itens da conta fora do escopo marcados "em breve" (ocultos no celular)            | não simular o que não existe                                                         |
| Perfil, Carteiras e Confirmação no celular adaptados                              | não há frame móvel                                                                   |
| Estimativa de taxa no carrinho usa Ethereum                                       | a rede é escolhida no pagamento, que recalcula                                       |
| Carrossel de relacionados com 15 itens                                            | três páginas, como os pontos do layout                                               |

## Limitações

- APIs, autenticação, carteiras, pagamento e blockchain são simulados.
- Os dados vivem no `localStorage` de cada navegador: não há compartilhamento entre dispositivos.
- Limitações do tempo real na seção de transporte.
- O timer de liquidação do pedido roda na página; se ela for fechada, a liquidação acontece na
  próxima consulta ou carregamento.
- Dois dependentes de decisões internas de bibliotecas, a revisar em atualizações: o padrão de
  URL do WebSocket no MSW e o substituto do `tldts`.
- As baselines visuais são por sistema operacional (a renderização de fontes muda). As versionadas
  são de Windows.
- Testes E2E rodam em Chromium; Firefox e Safari não foram verificados.
- Interface somente em português e tema escuro, como no layout.
