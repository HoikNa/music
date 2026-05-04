import axios, { AxiosInstance, AxiosError } from "axios"

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true"

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

const instance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
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
        const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"
        const { data } = await axios.post(
          `${baseURL}/auth/refresh`,
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

async function getMockData(url: string) {
  const { getMock } = await import("./mocks/handlers")
  return getMock(url)
}

export const api = {
  get: async <T>(url: string, params?: Record<string, unknown>): Promise<T> => {
    if (USE_MOCK) return getMockData(url) as Promise<T>
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
