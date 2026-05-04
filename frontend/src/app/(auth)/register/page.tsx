"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useAuthStore } from "@/stores/auth.store"
import type { AuthTokens, User } from "@/types/api"

export default function RegisterPage() {
  const router = useRouter()
  const { setAccessTokenAndUser } = useAuthStore()
  const [form, setForm] = useState({ email: "", nickname: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!form.email) e.email = "이메일을 입력해주세요"
    if (!form.nickname || form.nickname.length < 2) e.nickname = "닉네임은 2자 이상이어야 합니다"
    if (!form.password || form.password.length < 8) e.password = "비밀번호는 8자 이상이어야 합니다"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const tokens = await api.post<AuthTokens>("/auth/register", form)
      const user = await api.get<User>("/users/me")
      setAccessTokenAndUser(tokens.access_token, user)
      toast.success("환영합니다! 크레딧 10개가 지급되었습니다")
      router.push("/dashboard")
    } catch {
      toast.error("회원가입 중 오류가 발생했습니다. 다시 시도해주세요")
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
          <p className="text-[var(--text-muted)] mt-2 text-sm">가입 즉시 크레딧 10개 지급</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: "email", label: "이메일", type: "email", placeholder: "hello@example.com" },
              { key: "nickname", label: "닉네임", type: "text", placeholder: "2~20자" },
              { key: "password", label: "비밀번호", type: "password", placeholder: "8자 이상" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="text-sm font-medium mb-1.5 block">{label}</label>
                <Input
                  type={type}
                  placeholder={placeholder}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
                {errors[key] && (
                  <p className="text-xs mt-1" style={{ color: "var(--error)" }}>{errors[key]}</p>
                )}
              </div>
            ))}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              style={{ background: "var(--brand)" }}
            >
              {loading ? "가입 중..." : "무료로 시작하기"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-semibold" style={{ color: "var(--brand)" }}>
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
