"use client"

import axios from "axios"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState, useEffect, type ReactNode } from "react"
import { Toaster } from "@/components/ui/sonner"
import { setAccessToken } from "@/lib/api"
import { useAuthStore } from "@/stores/auth.store"
import type { User } from "@/types/api"

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
          },
        },
      })
  )

  const { setAccessTokenAndUser, setUser } = useAuthStore()

  useEffect(() => {
    // 새로고침 후 쿠키의 refresh_token으로 세션 복원
    const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

    axios
      .post<{ access_token: string }>(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
      .then(async ({ data }) => {
        setAccessToken(data.access_token)
        const { data: user } = await axios.get<User>(`${baseURL}/users/me`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        })
        setAccessTokenAndUser(data.access_token, user)
      })
      .catch(() => {
        setUser(null)
      })
  }, [setAccessTokenAndUser, setUser])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
