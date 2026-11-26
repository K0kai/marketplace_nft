import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import type { WalletConnection, WalletConnectionInput } from '@/api/contracts'
import { accountApi } from '@/api/endpoints'
import { errorMessage } from '@/api/errors'

/** Conexão simulada. Trocar carteira, provedor ou rede exige conectar de novo. */
export function useWalletConnection(wanted: WalletConnectionInput) {
  const [connection, setConnection] = useState<WalletConnection | null>(null)
  const connect = useMutation({
    mutationFn: (input: WalletConnectionInput) => accountApi.connectWallet(input),
    onSuccess: setConnection,
  })

  const current =
    connection &&
    connection.walletId === wanted.walletId &&
    connection.provider === wanted.provider &&
    connection.network === wanted.network
      ? connection
      : null

  function disconnect() {
    if (connection) void accountApi.disconnectWallet(connection.id).catch(() => undefined)
    setConnection(null)
    connect.reset()
  }

  return {
    connection: current,
    connecting: connect.isPending,
    error: connect.error && !current ? errorMessage(connect.error) : null,
    connect: () => connect.mutate(wanted),
    disconnect,
  }
}
