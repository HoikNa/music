"use client"

import { useEffect, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/stores/auth.store"

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user, isLoading } = useAuthStore()

  useEffect(() => {
    if (isLoading || user) return

    const query = window.location.search.replace(/^\?/, "")
    const redirect = `${pathname}${query ? `?${query}` : ""}`
    window.location.replace(`/login?redirect=${encodeURIComponent(redirect)}`)
  }, [isLoading, pathname, user])

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--ink-0)]" />
          <p className="label-mono mt-4">Restoring session</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
