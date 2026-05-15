import axios, { AxiosInstance, AxiosError } from "axios"

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true"
const API_BASE_URL = getApiBaseUrl()

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

const instance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
})

instance.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

instance.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        accessToken = data.access_token
        if (error.config) {
          error.config.headers.Authorization = `Bearer ${accessToken}`
          return instance(error.config)
        }
      } catch {
        accessToken = null
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
      }
    }
    return Promise.reject(error)
  }
)

export function getApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL
  if (typeof window === "undefined") {
    return configured ?? "http://localhost:8000/api/v1"
  }

  const isLocalHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  if (configured && isLocalHost) {
    return configured
  }

  if (configured && configured.startsWith(window.location.origin)) {
    return configured
  }

  return "/api/v1"
}

async function getMockData(url: string, params?: Record<string, unknown>) {
  const { getMock } = await import("./mocks/handlers")
  return getMock(url, params)
}

export const api = {
  get: async <T>(url: string, params?: Record<string, unknown>): Promise<T> => {
    if (USE_MOCK) return getMockData(url, params) as Promise<T>
    const { data } = await instance.get<T>(url, { params })
    return data
  },
  post: async <T>(url: string, body?: unknown): Promise<T> => {
    if (USE_MOCK) return getMockData(url) as Promise<T>
    const { data } = await instance.post<T>(url, body)
    return data
  },
  patch: async <T>(url: string, body?: unknown): Promise<T> => {
    if (USE_MOCK) return getMockData(url) as Promise<T>
    const { data } = await instance.patch<T>(url, body)
    return data
  },
  delete: async <T>(url: string): Promise<T> => {
    const { data } = await instance.delete<T>(url)
    return data
  },
}
