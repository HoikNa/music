"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useAuthStore } from "@/stores/auth.store"
import type { AuthTokens, User } from "@/types/api"

function LoginForm() {
  const router = useRouter()
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
      const user = await api.get<User>("/users/me")
      setAccessTokenAndUser(tokens.access_token, user)
      toast.success("로그인되었습니다")
      const redirect = searchParams.get("redirect") ?? "/dashboard"
      router.push(redirect)
    } catch {
      toast.error("이메일 또는 비밀번호를 확인해주세요")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, var(--background) 0%, #1a1340 100%)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black" style={{ color: "var(--brand)" }}>
            Vertual Owl
          </Link>
          <p className="text-[var(--text-muted)] mt-2 text-sm">다시 만나서 반가워요</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
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
              className="w-full"
              disabled={loading}
              style={{ background: "var(--brand)" }}
            >
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--card)] px-3 text-[var(--text-muted)]">또는</span>
            </div>
          </div>

          <Button variant="outline" className="w-full" disabled>
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
