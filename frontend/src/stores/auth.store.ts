"use client"

import { create } from "zustand"
import type { User } from "@/types/api"
import { setAccessToken } from "@/lib/api"

interface AuthStore {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setAccessTokenAndUser: (token: string, user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setAccessTokenAndUser: (token, user) => {
    setAccessToken(token)
    set({ user, isLoading: false })
  },
  logout: () => {
    setAccessToken(null)
    if (typeof window !== "undefined") sessionStorage.removeItem("access_token")
    set({ user: null, isLoading: false })
  },
}))
