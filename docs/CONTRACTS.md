# Contratos da API REST e dos eventos em tempo real

A fonte dos tipos é `src/api/contracts/` (schemas Zod). O cliente Axios valida **toda resposta**
com esses schemas e os handlers do MSW validam **todo corpo recebido** com os mesmos schemas.
Se este documento e o código divergirem, vale o código.

## Convenções

| Item               | Regra                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------- |
| Base               | `/api` (prefixada por `VITE_API_URL` quando definida)                                     |
| Formato            | JSON                                                                                      |
| Valores em ETH     | **string decimal** com até 18 casas (`"1.19"`). Nunca `number`.                           |
| Quantidades        | inteiros                                                                                  |
| Datas              | ISO 8601                                                                                  |
| Autenticação       | `Authorization: Bearer <token>`                                                           |
| Visitante          | `X-Guest-Id: <uuid>` (enviado em todas as requisições; só é usado no carrinho sem sessão) |
| Idempotência       | `Idempotency-Key: <uuid>` (obrigatório em `POST /orders`)                                 |
| Timeout do cliente | 8 000 ms (`VITE_API_TIMEOUT_MS`)                                                          |

### Formato de erro

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Revise os campos destacados",
    "fieldErrors": { "email": "E-mail inválido" },
    "details": {}
  }
}
```

`fieldErrors` usa os nomes dos campos do corpo enviado; a interface os liga aos inputs.

| HTTP | `code`                              | Quando                                                                |
| ---- | ----------------------------------- | --------------------------------------------------------------------- |
| 401  | `UNAUTHENTICATED`                   | rota privada sem token                                                |
| 401  | `SESSION_EXPIRED`                   | token vencido ou desconhecido (o cliente encerra a sessão)            |
| 401  | `INVALID_CREDENTIALS`               | login com e-mail ou senha errados                                     |
| 403  | `FORBIDDEN`                         | recurso de outra conta                                                |
| 404  | `NOT_FOUND`                         | recurso ou rota de API inexistente                                    |
| 409  | `CONFLICT`                          | e-mail, usuário ou carteira em conflito                               |
| 409  | `OUT_OF_STOCK`                      | edição esgotada ou quantidade acima do limite                         |
| 409  | `QUOTE_STALE`                       | valores mudaram desde a revisão (`details.quote` traz a nova cotação) |
| 409  | `IDEMPOTENCY_CONFLICT`              | mesma chave com conteúdo diferente                                    |
| 409  | `PENDING_ORDER`                     | já existe pedido pendente (`details.orderId`)                         |
| 409  | `WALLET_REJECTED`                   | conexão recusada, ausente ou incompatível                             |
| 422  | `VALIDATION_ERROR`                  | corpo ou cabeçalho inválido                                           |
| 422  | `COUPON_INVALID` / `COUPON_EXPIRED` | cupom                                                                 |
| 500  | `INTERNAL`                          | falha do servidor                                                     |
| 503  | `UNAVAILABLE`                       | falha transitória                                                     |

Códigos que só existem no cliente: `NETWORK` (sem resposta), `TIMEOUT` e `CONTRACT`
(resposta fora do schema).

**Falha transitória** é `NETWORK`, `TIMEOUT` ou status ≥ 500. Só elas permitem nova tentativa.

Toda rota privada pode responder `401`. Toda rota pode responder `500` ou `503`.

## Sessão e conta

| Método e rota         | Corpo                                            | Sucesso       | Erros próprios                                                                                   |
| --------------------- | ------------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------ |
| `POST /auth/register` | `{ username, email, password, confirmPassword }` | `201 Session` | `409 CONFLICT` (e-mail/usuário), `422` (inclui usuários reservados: `admin`, `kurio`, `suporte`) |
| `POST /auth/login`    | `{ email, password }`                            | `200 Session` | `401 INVALID_CREDENTIALS`, `422`                                                                 |
| `GET /auth/session`   | —                                                | `200 Session` | `401`                                                                                            |
| `POST /auth/logout`   | —                                                | `204`         | —                                                                                                |

```ts
Session = { token: string; expiresAt: string; user: Profile }
```

Login e cadastro **somam o carrinho do visitante** (`X-Guest-Id`) ao da conta, respeitando
estoque e limite por pedido.

Regras de campo: usuário com 3–24 caracteres (`a-z`, números, `.`, `_`); senha nova com ao menos
8 caracteres, uma letra e um número.

## NFTs

| Método e rota           | Sucesso                                            | Erros |
| ----------------------- | -------------------------------------------------- | ----- |
| `GET /nfts`             | `200 CatalogResponse`                              | —     |
| `GET /nfts/highlights`  | `200 { hero: NftSummary[]; featured: NftSummary }` | —     |
| `GET /nfts/:id`         | `200 NftDetail`                                    | `404` |
| `GET /nfts/:id/related` | `200 { items: NftSummary[] }`                      | `404` |

Parâmetros de `GET /nfts` (todos opcionais e combináveis; valor inválido é ignorado):

| Parâmetro              | Valores                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `q`                    | texto; busca em nome, ID do token, coleção e criador, sem diferenciar acentos                                      |
| `category`             | `digital-art`, `photography`, `music`, `3d-art`, `collectibles`, `generative`, `games`, `subscriptions`, `utility` |
| `network`              | `ethereum`, `polygon`, `solana`                                                                                    |
| `minPrice`, `maxPrice` | ETH em string decimal                                                                                              |
| `tab`                  | `all` (padrão), `new` (últimos 14 dias), `trending`                                                                |
| `sort`                 | `recent` (padrão), `price-asc`, `price-desc`, `name`                                                               |
| `page`                 | inteiro ≥ 1; fora do intervalo volta para a última página                                                          |

```ts
CatalogResponse = {
  items: NftSummary[]; page; pageSize: 9; total; totalPages
  facets: {
    categories: { id; count }[]   // cada faceta ignora o próprio filtro
    networks: { id; count }[]
    priceRange: { min: Eth; max: Eth }
  }
}

NftSummary = {
  id; name; tokenId; artwork; price: Eth; previousPrice: Eth | null; rare
  category; network; listedAt; version: number
  editions: { id: '1-1' | '1-10' | '1-50' | 'open'; available; maxPerOrder }[]
}

NftDetail = NftSummary & {
  summary; description: string[]; collection; creator; attributes; gallery
  rating; reviewsCount; reviews; contractAddress; royaltyPercent
}
```

`version` cresce a cada mudança de preço ou estoque e é a mesma do evento `nft.updated`.

## Favoritos (autenticado)

| Método e rota              | Sucesso                                      | Erros        |
| -------------------------- | -------------------------------------------- | ------------ |
| `GET /favorites`           | `200 { ids: string[]; items: NftSummary[] }` | —            |
| `PUT /favorites/:nftId`    | `200` (lista atualizada)                     | `404`, `500` |
| `DELETE /favorites/:nftId` | `200` (lista atualizada)                     | `404`, `500` |

`PUT` e `DELETE` são idempotentes.

## Carrinho e cotação (visitante ou autenticado)

| Método e rota                | Corpo                            | Sucesso     | Erros                                           |
| ---------------------------- | -------------------------------- | ----------- | ----------------------------------------------- |
| `GET /cart`                  | —                                | `200 Cart`  | —                                               |
| `POST /cart/items`           | `{ nftId, editionId, quantity }` | `201 Cart`  | `404`, `409 OUT_OF_STOCK` (`details.available`) |
| `PATCH /cart/items/:itemId`  | `{ quantity }`                   | `200 Cart`  | `404`, `409 OUT_OF_STOCK`                       |
| `DELETE /cart/items/:itemId` | —                                | `200 Cart`  | —                                               |
| `PUT /cart/coupon`           | `{ code }`                       | `200 Cart`  | `422 COUPON_INVALID`, `422 COUPON_EXPIRED`      |
| `DELETE /cart/coupon`        | —                                | `200 Cart`  | —                                               |
| `POST /quotes`               | `{ network }`                    | `200 Quote` | `422`                                           |

```ts
Cart = { items: CartItem[]; couponCode: string | null; itemCount; version }

CartItem = {
  id            // `${nftId}__${editionId}`
  nftId; editionId; quantity; name; tokenId; artwork
  unitPrice: Eth; lineTotal: Eth
  nftVersion    // versão do NFT usada para preço e estoque
  available; maxQuantity
  issue: 'SOLD_OUT' | 'INSUFFICIENT_STOCK' | null
}

Quote = {
  id            // hash do conteúdo: qualquer valor diferente gera outro id
  network; items: CartItem[]
  coupon: { code; label; basisPoints } | null
  couponError: string | null   // cupom que venceu depois de aplicado
  subtotal; discount; networkFee; total: Eth
  purchasable   // false se houver item com problema
}
```

- Preço e estoque vêm **sempre do catálogo atual**, nunca do cliente.
- Reduzir a quantidade é sempre permitido, mesmo com estoque insuficiente.
- `total = subtotal − discount + networkFee`. O desconto é arredondado para baixo em wei.
- Taxas de rede: Ethereum `0.016`, Polygon `0.002`, Solana `0.001`.
- A cotação não vence por tempo: ela deixa de valer quando o conteúdo muda.

## Pedidos (autenticado)

| Método e rota                | Sucesso                                                           | Erros                                                                                                   |
| ---------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `POST /orders`               | `201 Order` (novo) ou `200 Order` com `Idempotent-Replayed: true` | `403`, `409 IDEMPOTENCY_CONFLICT / PENDING_ORDER / WALLET_REJECTED / OUT_OF_STOCK / QUOTE_STALE`, `422` |
| `GET /orders?status=pending` | `200 { items: Order[] }`                                          | —                                                                                                       |
| `GET /orders/:id`            | `200 Order`                                                       | `403`, `404`                                                                                            |

Corpo de `POST /orders`:

```ts
{
  quoteId; walletId; connectionId; provider; network
  collector: {
    displayName; username; network; profileName
    walletAddress; secondaryWallet?; walletType; referralCode
    email; ensSuffix: '.eth'; ensName; note?
  }
}
```

### Ordem de validação no servidor

1. **Idempotência** (antes de tudo): chave já usada com o mesmo corpo devolve o pedido
   original, mesmo que preço ou carrinho tenham mudado; com outro corpo, `409 IDEMPOTENCY_CONFLICT`.
2. Pedido pendente de outra chave: `409 PENDING_ORDER`.
3. Carteira da conta (`403`) e conexão ativa e compatível (`409 WALLET_REJECTED`).
4. Nova cotação: carrinho vazio (`422`), item indisponível (`409 OUT_OF_STOCK`) ou
   `quoteId` diferente (`409 QUOTE_STALE`).

```ts
Order = {
  id; status: 'pending' | 'confirmed' | 'declined'; version
  createdAt; updatedAt; declineReason: string | null
  receipt: { lines; subtotal; discount; couponCode; networkFee; total }  // retrato da compra
  wallet: { id; provider; network; address }
  collector
  transaction: { hash; explorerUrl }   // fictícios; explorerUrl é uma rota do app
}
```

- `pending → confirmed | declined`. Os dois estados finais nunca mudam.
- `receipt` é gravado na criação; mudanças no catálogo não o alteram.
- Na confirmação, saem do carrinho **somente os itens e quantidades comprados**, e o estoque baixa.
- Na recusa, o carrinho não é alterado.

## Perfil e carteiras (autenticado)

| Método e rota                    | Corpo                                                                  | Sucesso                              | Erros                                 |
| -------------------------------- | ---------------------------------------------------------------------- | ------------------------------------ | ------------------------------------- |
| `GET /profile`                   | —                                                                      | `200 Profile`                        | —                                     |
| `PATCH /profile`                 | `{ displayName, username, email, ensName, ensSuffix, walletNickname }` | `200 Profile`                        | `409 CONFLICT`, `422`                 |
| `PUT /profile/avatar`            | `{ dataUrl }` (PNG, JPG ou WebP, até 512 KB)                           | `200 Profile`                        | `422`                                 |
| `DELETE /profile/avatar`         | —                                                                      | `200 Profile`                        | —                                     |
| `PUT /profile/password`          | `{ currentPassword, newPassword, confirmPassword }`                    | `204`                                | `422` (`fieldErrors.currentPassword`) |
| `GET /wallets`                   | —                                                                      | `200 { items: Wallet[] }`            | —                                     |
| `POST /wallets`                  | `WalletInput`                                                          | `201 Wallet`                         | `409 CONFLICT`, `422`                 |
| `PUT /wallets/:id`               | `WalletInput`                                                          | `200 Wallet`                         | `403`, `404`, `409`, `422`            |
| `POST /wallet-connections`       | `{ walletId, provider, network }`                                      | `201 { id, …, status: 'connected' }` | `404`, `409 WALLET_REJECTED`          |
| `DELETE /wallet-connections/:id` | —                                                                      | `204`                                | —                                     |

```ts
Profile = { id; displayName; username; email; ensName; ensSuffix; walletNickname; avatarUrl: string | null }

WalletInput = {
  slot: 'primary' | 'secondary'   // uma de cada por conta
  displayName; nickname; network; profileName
  address         // 0x + 40 hexadecimais
  secondaryAddress?; provider; referralCode; email; ensSuffix; ensName
}
```

Hash e salt de senha nunca saem do servidor.

## Eventos em tempo real (Socket.IO)

Conexão: `io(VITE_SOCKET_URL ?? origem, { transports: ['websocket'], auth: { token } })`.
Visitantes conectam sem `auth` e recebem só eventos públicos.

Campos comuns:

```ts
{
  eventId: string        // identidade estável: duplicatas têm o mesmo id
  type: 'nft.updated' | 'order.updated'
  resource: { type: 'nft' | 'order'; id: string }
  version: number        // versão do recurso: crescente
  userId: string | null  // dono do evento privado; null = público
  occurredAt: string
  payload: …
}
```

| Evento          | Visibilidade | `payload`                                                            |
| --------------- | ------------ | -------------------------------------------------------------------- |
| `nft.updated`   | pública      | `{ price, previousPrice, editions }` (estado completo, não um delta) |
| `order.updated` | privada      | `{ status, declineReason, updatedAt }`                               |

### Regras do cliente

1. O payload é validado pelo schema; evento malformado é ignorado.
2. `eventId` já visto é descartado.
3. `version` menor ou igual à última aceita para o recurso é descartada.
4. O cache só é alterado se estiver numa versão **anterior** à do evento.
5. `order.updated` exige `userId` igual ao da sessão atual.
6. Estados finais de pedido não são sobrescritos.

Não há confirmação de entrega nem reenvio: eventos perdidos são reconciliados por REST
(ver `ARCHITECTURE.md`).

## Rotas de controle do mock (fora do produto)

Usadas pela página `/demo` e pelos testes. Só existem com `VITE_ENABLE_MOCKS=true`.

| Rota                                                                      | Efeito                                                         |
| ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `GET /__mock/state`                                                       | cenário, lista de cenários, sockets conectados, pedidos        |
| `POST /__mock/scenario` `{ name }`                                        | troca o cenário sem apagar os dados                            |
| `POST /__mock/reset` `{ scenario? }`                                      | restaura os fixtures                                           |
| `POST /__mock/nfts/:id` `{ price?, editions? }`                           | altera o catálogo e publica `nft.updated`                      |
| `GET /__mock/events`                                                      | últimos 50 eventos publicados nesta aba                        |
| `POST /__mock/emit` (evento)                                              | entrega um evento arbitrário pelo socket (duplicatas, antigos) |
| `POST /__mock/socket` `{ action: 'disconnect' \| 'offline' \| 'online' }` | controla a conexão                                             |
| `POST /__mock/orders/:id/settle` `{ outcome }`                            | confirma ou recusa um pedido pendente                          |
| `POST /__mock/session/expire`                                             | vence todas as sessões                                         |
