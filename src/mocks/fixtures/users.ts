import type { Profile, Wallet } from '../../api/contracts/index.ts'

export type UserRecord = Profile & { passwordHash: string; passwordSalt: string }
export type WalletRecord = Wallet & { userId: string }

// Credenciais fictícias ficam documentadas no README; aqui só vão os hashes.
export function createUserFixtures(): UserRecord[] {
  return [
    {
      id: 'user-nova',
      displayName: 'Nova Sato',
      username: 'novasato',
      email: 'nova@kurio.test',
      ensName: 'nova',
      ensSuffix: '.eth',
      walletNickname: 'Principal',
      avatarUrl: null,
      passwordSalt: 'salt-nova',
      passwordHash: '42ee525fd74a35551f4edd8ebda9cffe1a982392f6ace4213178a21115dc1fa8',
    },
    {
      id: 'user-leo',
      displayName: 'Leo Martins',
      username: 'leomartins',
      email: 'leo@kurio.test',
      ensName: 'leo',
      ensSuffix: '.eth',
      walletNickname: 'Cofre',
      avatarUrl: null,
      passwordSalt: 'salt-leo',
      passwordHash: '18257a237e272f2edba4c6118de4ad147136ee3314d0c723e0fc3941caf91696',
    },
  ]
}

export function createWalletFixtures(): WalletRecord[] {
  return [
    {
      id: 'wallet-nova-primary',
      userId: 'user-nova',
      slot: 'primary',
      displayName: 'Nova Sato',
      nickname: 'Principal',
      network: 'ethereum',
      profileName: 'Nova Collector',
      address: '0xA91F3c5B7e2D4a8F9b1C6d0E5f7A2B8c4D6eE82C',
      secondaryAddress: '',
      provider: 'metamask',
      referralCode: 'KURIO-NOVA',
      email: 'nova@kurio.test',
      ensSuffix: '.eth',
      ensName: 'nova',
    },
    {
      id: 'wallet-nova-secondary',
      userId: 'user-nova',
      slot: 'secondary',
      displayName: 'Nova Sato',
      nickname: 'Reserva',
      network: 'polygon',
      profileName: 'Nova Reserva',
      address: '0x3B7e9A1c4D2f8E6b5C0a7F9d1E3c5B7a9D2f4C61',
      secondaryAddress: 'nova.kurio.eth',
      provider: 'coinbase',
      referralCode: 'KURIO-NOVA',
      email: 'nova@kurio.test',
      ensSuffix: '.eth',
      ensName: 'nova.kurio',
    },
    {
      id: 'wallet-leo-primary',
      userId: 'user-leo',
      slot: 'primary',
      displayName: 'Leo Martins',
      nickname: 'Cofre',
      network: 'solana',
      profileName: 'Leo Vault',
      address: '0x5C2d8F4a1B9e7D3c6A0f2E8b4C6d1F9a3E5b7D24',
      secondaryAddress: '',
      provider: 'walletconnect',
      referralCode: 'KURIO-LEO',
      email: 'leo@kurio.test',
      ensSuffix: '.eth',
      ensName: 'leo',
    },
  ]
}

export function createFavoriteFixtures(): Record<string, string[]> {
  return {
    'user-nova': ['sage-nomad-009', 'neon-vessel-552'],
    'user-leo': ['golden-beat-207'],
  }
}
