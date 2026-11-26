import axios, { type AxiosRequestConfig } from 'axios'
import type { z } from 'zod'
import { endSession, getGuestId, sessionStore } from '@/features/session/session-store'
import { whenNetworkReady } from '@/lib/network-gate'
import { ApiError, toApiError } from './errors'

export const http = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api`,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS) || 8000,
})

http.interceptors.request.use(async (config) => {
  await whenNetworkReady()
  const session = sessionStore.get()
  if (session) config.headers.set('Authorization', `Bearer ${session.token}`)
  config.headers.set('X-Guest-Id', getGuestId())
  return config
})

http.interceptors.response.use(undefined, (error: unknown) => {
  // cancelamento não é erro de negócio: o TanStack Query trata sozinho
  if (axios.isCancel(error)) return Promise.reject(error)
  const apiError = toApiError(error)

  if (apiError.code === 'SESSION_EXPIRED' && axios.isAxiosError(error)) {
    // só encerra se a resposta for da sessão atual, e não de uma requisição antiga
    const sent = String(error.config?.headers.Authorization ?? '')
    if (sent === `Bearer ${sessionStore.get()?.token}`) endSession('expired')
  }
  return Promise.reject(apiError)
})

/** Toda resposta passa pelo schema do contrato antes de chegar à interface. */
export async function request<T extends z.ZodType>(
  schema: T,
  config: AxiosRequestConfig,
): Promise<z.output<T>> {
  const { data } = await http.request<unknown>(config)
  const result = schema.safeParse(data)
  if (!result.success) {
    console.error('Resposta fora do contrato', config.url, result.error.issues)
    throw new ApiError('CONTRACT', 'O servidor respondeu em um formato inesperado.')
  }
  return result.data
}
