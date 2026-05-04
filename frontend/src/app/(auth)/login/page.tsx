"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { api, setAccessToken } from "@/lib/api"
import { useAuthStore } from "@/stores/auth.store"
import type { AuthTokens, User } from "@/types/api"

function LoginForm() {
  const searchParams = useSearchParams()
  const { setAccessTokenAndUser } = useAuthStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      const tokens = await api.post<AuthTokens>("/auth/login", { email, password })
      setAccessToken(tokens.access_token)
      const user = await api.get<User>("/users/me")
      setAccessTokenAndUser(tokens.access_token, user)
      toast.success("로그인되었습니다")
      window.location.assign(getSafeRedirect(searchParams.get("redirect")))
    } catch {
      toast.error("이메일 또는 비밀번호를 확인해주세요")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-surface flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="brand-gradient flex size-10 items-center justify-center rounded-lg text-white shadow-md">
              <Sparkles className="size-5" />
            </span>
            <span className="text-2xl font-black text-[var(--foreground)]">
              Vertual Owl
            </span>
          </Link>
          <p className="mt-3 text-sm text-[var(--text-muted)]">다시 만나서 반가워요</p>
        </div>

        <div className="app-card-lift p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-black">로그인</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">보컬 심사와 랭킹 현황을 이어서 확인하세요.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">이메일</label>
              <Input
                type="email"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">비밀번호</label>
              <Input
                type="password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-full"
              disabled={loading}
              style={{ background: "linear-gradient(135deg, var(--brand), var(--accent-pink))" }}
            >
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-[var(--text-muted)]">또는</span>
            </div>
          </div>

          <Button variant="outline" className="w-full rounded-full bg-white/70" disabled>
            카카오로 로그인 (준비중)
          </Button>
        </div>

        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          계정이 없으신가요?{" "}
          <Link href="/register" className="font-semibold" style={{ color: "var(--brand)" }}>
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}

function getSafeRedirect(redirect: string | null) {
  if (
    !redirect ||
    !redirect.startsWith("/") ||
    redirect.startsWith("//") ||
    redirect.startsWith("/login") ||
    redirect.startsWith("/register")
  ) {
    return "/dashboard"
  }

  return redirect
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
