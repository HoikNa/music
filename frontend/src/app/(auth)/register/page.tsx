"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AxiosError } from "axios"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { api, setAccessToken } from "@/lib/api"
import { useAuthStore } from "@/stores/auth.store"
import type { AuthTokens, User } from "@/types/api"

type ApiErrorBody = {
  detail?: string | { msg?: string }[]
}

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
      setAccessToken(tokens.access_token)
      const user = await api.get<User>("/users/me")
      setAccessTokenAndUser(tokens.access_token, user)
      toast.success("환영합니다! 크레딧 10개가 지급되었습니다")
      router.replace("/dashboard")
    } catch (error) {
      const message = getRegisterErrorMessage(error)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  function getRegisterErrorMessage(error: unknown) {
    if (!(error instanceof AxiosError)) {
      return "회원가입 중 오류가 발생했습니다. 다시 시도해주세요"
    }

    const data = error.response?.data as ApiErrorBody | undefined
    const detail = typeof data?.detail === "string" ? data.detail : undefined

    if (error.response?.status === 409 && detail?.includes("Email")) {
      setErrors({ email: "이미 가입된 이메일입니다" })
      return "이미 가입된 이메일입니다. 로그인해주세요"
    }

    if (error.response?.status === 409 && detail?.includes("Nickname")) {
      setErrors({ nickname: "이미 사용 중인 닉네임입니다" })
      return "이미 사용 중인 닉네임입니다"
    }

    if (error.response?.status === 422) {
      return "입력한 회원가입 정보를 다시 확인해주세요"
    }

    return detail ?? "회원가입 중 오류가 발생했습니다. 다시 시도해주세요"
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
          <p className="mt-3 text-sm text-[var(--text-muted)]">가입 즉시 크레딧 10개 지급</p>
        </div>

        <div className="app-card-lift p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-black">무료로 시작하기</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">AI 페르소나 심사를 위한 창작자 계정을 만듭니다.</p>
          </div>
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
              className="w-full rounded-full"
              disabled={loading}
              style={{ background: "linear-gradient(135deg, var(--brand), var(--accent-pink))" }}
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
