import type { OrderRecord } from '../db/store.ts'

// Um pedido já confirmado do Leo: serve para testar acesso não autorizado (403).
export function createSeedOrders(): OrderRecord[] {
  return [
    {
      id: 'order-leo-seed',
      userId: 'user-leo',
      status: 'confirmed',
      version: 2,
      createdAt: '2026-07-20T15:00:00.000Z',
      updatedAt: '2026-07-20T15:00:05.000Z',
      declineReason: null,
      receipt: {
        lines: [
          {
            nftId: 'golden-beat-207',
            editionId: '1-50',
            name: 'Golden Beat #207',
            tokenId: '0207',
            artwork: 'golden',
            quantity: 1,
            unitPrice: '0.99',
            lineTotal: '0.99',
          },
        ],
        subtotal: '0.99',
        discount: '0',
        couponCode: null,
        networkFee: '0.001',
        total: '0.991',
      },
      wallet: {
        id: 'wallet-leo-primary',
        provider: 'walletconnect',
        network: 'solana',
        address: '0x5C2d8F4a1B9e7D3c6A0f2E8b4C6d1F9a3E5b7D24',
      },
      collector: {
        displayName: 'Leo Martins',
        username: 'leomartins',
        network: 'solana',
        profileName: 'Leo Vault',
        walletAddress: '0x5C2d8F4a1B9e7D3c6A0f2E8b4C6d1F9a3E5b7D24',
        walletType: 'walletconnect',
        referralCode: 'KURIO-LEO',
        email: 'leo@kurio.test',
        ensSuffix: '.eth',
        ensName: 'leo',
      },
      transaction: {
        hash: '0x9c1e4b7a2d5f8036c4a9e1b2d7f0a8c3e5b9d1f4a6c2e8b0d3f5a7c9e1b4d6f8',
        explorerUrl: '/explorer/0x9c1e4b7a2d5f8036c4a9e1b2d7f0a8c3e5b9d1f4a6c2e8b0d3f5a7c9e1b4d6f8',
      },
      idempotencyKey: 'seed-leo',
      requestHash: 'seed',
      settleAt: null,
      outcome: 'confirmed',
    },
  ]
}
