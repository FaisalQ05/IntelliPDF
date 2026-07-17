export type ApiSuccess<T> = {
  success: true
  data: T
  message: string
  timestamp: string
}

export type ApiError = {
  success: false
  message: string
  timestamp: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
