import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios"
import { useAuthStore } from "@/features/auth/store/auth.store"
import { env } from "@/config/env"

export const API_URL = env.VITE_API_URL

// ---------------------------
// AXIOS INSTANCE
// ---------------------------
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

// ---------------------------
// SAFE HEADER HELPER
// ---------------------------
const setAuthHeader = (config: InternalAxiosRequestConfig, token: string) => {
  if (!config.headers) {
    config.headers = new AxiosHeaders()
  }

  // Ensure headers are AxiosHeaders instance
  const headers = AxiosHeaders.from(config.headers)

  headers.set("Authorization", `Bearer ${token}`)

  config.headers = headers
}
// ---------------------------
// REFRESH TOKEN (PLAIN AXIOS)
// ---------------------------
export const refreshAccessToken = async (): Promise<string> => {
  const response = await axios.post(
    `${API_URL}/auth/refresh`,
    {},
    { withCredentials: true }
  )

  const newToken = response.data.data.accessToken

  useAuthStore.getState().updateAccessToken(newToken)

  return newToken
}

// ---------------------------
// REFRESH STATE (QUEUE)
// ---------------------------
let isRefreshing = false

let failedQueue: {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}[] = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token!)
    }
  })

  failedQueue = []
}

// ---------------------------
// REQUEST INTERCEPTOR
// ---------------------------
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      setAuthHeader(config, token)
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ---------------------------
// RESPONSE INTERCEPTOR
// ---------------------------
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    const status = error?.response?.status

    // ---------------------------
    // HANDLE 401
    // ---------------------------
    if (status === 401 && !originalRequest._retry) {
      // If refresh already in progress → queue request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              setAuthHeader(originalRequest, token)
              resolve(api(originalRequest))
            },
            reject: (err) => reject(err),
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const newToken = await refreshAccessToken()

        // Resolve all queued requests
        processQueue(null, newToken)

        // Retry original request
        setAuthHeader(originalRequest, newToken)
        return api(originalRequest)
      } catch (err) {
        // logout user if refresh fails
        useAuthStore.getState().logout()
        processQueue(err, null)

        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

