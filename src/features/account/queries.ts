import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PasswordInput, Profile, ProfileInput, WalletInput } from '@/api/contracts'
import { accountApi } from '@/api/endpoints'
import { queryKeys } from '@/api/query-keys'
import { useSession } from '@/features/session/session-store'

export function useProfile() {
  const userId = useSession()?.userId ?? ''
  return useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: ({ signal }) => accountApi.profile({ signal }),
    enabled: Boolean(userId),
  })
}

function useProfileMutation<T>(mutationFn: (input: T) => Promise<Profile>) {
  const client = useQueryClient()
  const userId = useSession()?.userId ?? ''
  return useMutation({
    mutationFn,
    onSuccess: (profile) => client.setQueryData(queryKeys.profile(userId), profile),
  })
}

export const useUpdateProfile = () =>
  useProfileMutation((input: ProfileInput) => accountApi.updateProfile(input))
export const useSetAvatar = () =>
  useProfileMutation((dataUrl: string) => accountApi.setAvatar(dataUrl))
export const useRemoveAvatar = () => useProfileMutation((_: void) => accountApi.removeAvatar())
export const useChangePassword = () =>
  useMutation({ mutationFn: (input: PasswordInput) => accountApi.changePassword(input) })

export function useWallets() {
  const userId = useSession()?.userId ?? ''
  return useQuery({
    queryKey: queryKeys.wallets(userId),
    queryFn: ({ signal }) => accountApi.wallets({ signal }),
    enabled: Boolean(userId),
    select: (data) => data.items,
  })
}

export function useSaveWallet() {
  const client = useQueryClient()
  const userId = useSession()?.userId ?? ''
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: WalletInput }) =>
      id ? accountApi.updateWallet(id, input) : accountApi.createWallet(input),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.wallets(userId) }),
  })
}
