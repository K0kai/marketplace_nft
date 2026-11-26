import axios from 'axios'
import { apiErrorBodySchema, type ErrorCode } from './contracts'

export type ClientErrorCode = ErrorCode | 'NETWORK' | 'TIMEOUT' | 'CONTRACT'

export class ApiError extends Error {
  readonly code: ClientErrorCode
  readonly status: number | null
  readonly fieldErrors: Record<string, string>
  readonly details: unknown

  constructor(
    code: ClientErrorCode,
    message: string,
    options: { status?: number; fieldErrors?: Record<string, string>; details?: unknown } = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = options.status ?? null
    this.fieldErrors = options.fieldErrors ?? {}
    this.details = options.details
  }

  /** Só falhas transitórias podem ser repetidas automaticamente. */
  get isTransient() {
    return this.code === 'NETWORK' || this.code === 'TIMEOUT' || (this.status ?? 0) >= 500
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError('TIMEOUT', 'A resposta demorou demais. Verifique antes de repetir.')
    }
    if (!error.response) {
      return new ApiError('NETWORK', 'Sem conexão com o servidor. Verifique sua internet.')
    }
    const parsed = apiErrorBodySchema.safeParse(error.response.data)
    if (parsed.success) {
      const { code, message, fieldErrors, details } = parsed.data.error
      return new ApiError(code, message, {
        status: error.response.status,
        fieldErrors,
        details,
      })
    }
    return new ApiError('INTERNAL', 'O servidor respondeu de forma inesperada.', {
      status: error.response.status,
    })
  }
  return new ApiError('INTERNAL', 'Algo deu errado.')
}

export const errorMessage = (error: unknown) => toApiError(error).message
