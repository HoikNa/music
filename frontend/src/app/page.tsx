import Link from "next/link"
import { Mic2, Trophy, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-white/78 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-black tracking-tight text-[var(--foreground)]">
            Vertual Owl
          </span>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">로그인</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" style={{ background: "var(--brand)" }}>
                무료 시작
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,92,255,0.18) 0%, transparent 70%)"
        }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <Badge className="mb-6 text-xs font-bold tracking-widest" style={{ background: "var(--brand-bg)", color: "var(--brand)" }}>
            AI POWERED · K-VOCAL
          </Badge>
          <h1 className="text-5xl md:text-6xl font-black leading-tight tracking-tight mb-6">
            AI가 검증하고<br />
            <span style={{ background: "linear-gradient(135deg, var(--brand-light), var(--accent-pink))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              프로가 발굴하는
            </span><br />
            음원 경연 플랫폼
          </h1>
          <p className="text-lg text-[var(--text-muted)] mb-10 max-w-xl mx-auto leading-relaxed">
            김범수, 아이유, 박효신의 AI 페르소나가 당신의 가창을 심사합니다.
            주간 랭킹 1위를 차지하고 정식 데뷔의 기회를 잡으세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button size="lg" className="px-8" style={{ background: "linear-gradient(135deg, var(--brand), var(--accent-pink))" }}>
                지금 도전하기
              </Button>
            </Link>
            <Link href="/rankings">
              <Button size="lg" variant="outline" className="bg-white/70 px-8">
                랭킹 보기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">3가지 핵심 경험</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Mic2,
                title: "페르소나 AI 심사",
                desc: "김범수, 아이유, 박효신의 취향을 학습한 AI가 당신의 가창에 맞춤 피드백을 제공합니다.",
                color: "var(--brand)",
              },
              {
                icon: Trophy,
                title: "주간 랭킹 서바이벌",
                desc: "오락실 스코어보드 방식의 실시간 경쟁. 주간 1위는 월간 왕중왕전 진출권을 획득합니다.",
                color: "var(--accent)",
              },
              {
                icon: Zap,
                title: "가수를 이겨라",
                desc: "프로 가수가 설정한 마스터 스코어에 도전. 격파 시 실제 가수와의 1:1 멘토링 세션.",
                color: "var(--accent-pink)",
              },
            ].map((f) => {
              const Icon = f.icon
              return (
              <div key={f.title} className="app-card p-6">
                <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-[var(--brand-bg)]" style={{ color: f.color }}>
                  <Icon className="size-5" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{f.desc}</p>
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center border-t border-[var(--border-subtle)]">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">지금 바로 시작하세요</h2>
          <p className="text-[var(--text-muted)] mb-8">가입 즉시 크레딧 10개 지급. 첫 번째 도전은 무료입니다.</p>
          <Link href="/register">
            <Button size="lg" className="px-10" style={{ background: "var(--brand)" }}>
              무료로 시작하기
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-8 px-6 text-center text-sm text-[var(--text-disabled)]">
        © 2026 Vertual Owl. All rights reserved.
      </footer>
    </div>
  )
}
