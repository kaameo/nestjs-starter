export interface PaginationMeta {
  readonly total: number
  readonly page: number
  readonly limit: number
  readonly totalPages: number
}

export interface ApiSuccessResponse<T> {
  readonly success: true
  readonly data: T
  readonly meta?: PaginationMeta
}

export interface ApiErrorResponse {
  readonly success: false
  readonly error: {
    readonly code: ErrorCode
    readonly message: string
    readonly details: object | null
  }
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'ALREADY_VERIFIED'
  | 'EMAIL_NOT_VERIFIED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
