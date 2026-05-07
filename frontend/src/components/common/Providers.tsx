"use client"

import axios from "axios"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState, useEffect, type ReactNode } from "react"
import { Toaster } from "@/components/ui/sonner"
import { getAccessToken, setAccessToken } from "@/lib/api"
import { useAuthStore } from "@/stores/auth.store"
import type { User } from "@/types/api"

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  const { setAccessTokenAndUser, setUser } = useAuthStore()

  useEffect(() => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

    const restoreSession = async () => {
      // 1순위: sessionStorage 토큰 (하드 리로드 후에도 유지)
      const stored = sessionStorage.getItem("access_token")
      if (stored) {
        try {
          setAccessToken(stored)
          const { data: user } = await axios.get<User>(`${baseURL}/users/me`, {
            headers: { Authorization: `Bearer ${stored}` },
          })
          setAccessTokenAndUser(stored, user)
          return
        } catch {
          sessionStorage.removeItem("access_token")
        }
      }

      // 2순위: refresh_token 쿠키 (same-site 환경)
      try {
        const { data } = await axios.post<{ access_token: string }>(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        setAccessToken(data.access_token)
        sessionStorage.setItem("access_token", data.access_token)
        const { data: user } = await axios.get<User>(`${baseURL}/users/me`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        })
        setAccessTokenAndUser(data.access_token, user)
      } catch {
        if (getAccessToken()) return
        setUser(null)
      }
    }

    restoreSession()
  }, [setAccessTokenAndUser, setUser])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" />
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
