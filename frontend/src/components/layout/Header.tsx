"use client"

import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/stores/auth.store"
import { api } from "@/lib/api"
import { toast } from "sonner"

export function Header() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  async function handleLogout() {
    try {
      await api.post("/auth/logout", {})
    } catch { /* 무시 */ }
    logout()
    toast.success("로그아웃되었습니다")
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur flex items-center justify-between px-6">
      <div className="lg:hidden text-lg font-black" style={{ color: "var(--brand)" }}>
        Vertual Owl
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 h-9 px-3 rounded-md hover:bg-[var(--secondary)] transition-colors">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "var(--brand)" }}>
                {user.nickname[0]}
              </div>
              <span className="text-sm hidden sm:block">{user.nickname}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem disabled className="text-xs text-[var(--text-muted)]">
                크레딧 {user.credit_balance}개
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/credits")}>
                크레딧 충전
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-[var(--error)]">
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
