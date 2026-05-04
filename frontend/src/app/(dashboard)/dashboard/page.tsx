"use client"

import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Disc3,
  Play,
  Sparkles,
  Trophy,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth.store"

const stats = [
  { label: "Released", value: "5", meta: "+2 this quarter" },
  { label: "Revenue", value: "₩487K", meta: "May projection" },
  { label: "Streams", value: "128K", meta: "+18.2% month" },
  { label: "Followers", value: "2,341", meta: "312 new listeners" },
]

const projects = [
  { title: "서울의 밤", type: "Single", progress: 78, state: "Mix review", accent: "ph-k1" },
  { title: "3시 32분", type: "Demo", progress: 42, state: "Lyrics lock", accent: "ph-k2" },
  { title: "한강 블루스", type: "Contest", progress: 91, state: "Ready", accent: "ph-k3" },
]

const activity = [
  { title: "AI 보컬 테이크 04 생성 완료", time: "12분 전", icon: Sparkles },
  { title: "Spring Contest 제출 검수 통과", time: "1시간 전", icon: CheckCircle2 },
  { title: "서울의 밤 자동 저장", time: "2시간 전", icon: Clock3 },
  { title: "새 청취자 피드백 18개 도착", time: "어제", icon: Disc3 },
]

export default function DashboardPage() {
  const { user } = useAuthStore()
  const name = user?.nickname ?? "서연"

  return (
    <div className="mx-auto max-w-[1180px] space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.45fr_0.55fr]">
        <div className="app-card-lift overflow-hidden p-7 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="vo-tag vo-tag-amber">Tuesday · May 5, 2026 · 10:42 AM</span>
            <span className="vo-tag">자동 저장됨 · 2시간 전</span>
          </div>
          <h1 className="h-display mt-7 max-w-[760px]">
            안녕하세요, {name}. 오늘은 <em>「서울의 밤」</em>을 마무리할까요?
          </h1>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/ai-studio" className="vo-btn vo-btn-primary">
              <Sparkles className="size-4" />
              AI 작곡
            </Link>
            <Link href="/creator-studio" className="vo-btn vo-btn-ghost">
              <Play className="size-4" />
              스튜디오 열기
            </Link>
          </div>
          <div className="mt-8 max-w-[420px]">
            <div className="mb-2 flex items-center justify-between text-xs text-[var(--ink-2)]">
              <span>v.3 · 78% 완성</span>
              <span>Mix review</span>
            </div>
            <div className="vo-progress h-[3px]">
              <span style={{ width: "78%" }} />
            </div>
          </div>
        </div>

        <aside className="app-card-lift flex flex-col justify-between p-6">
          <div>
            <div className="label-mono">Featured Contest</div>
            <h2 className="h-2 mt-4">Spring 2026 Contest</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-2)]">
              한강의 밤을 주제로 한 신곡 제출 라운드가 일주일 남았습니다.
            </p>
          </div>
          <div className="mt-8">
            <div className="mb-4 flex items-end justify-between">
              <span className="font-serif text-4xl text-[var(--amber)]">D-7</span>
              <Trophy className="size-5 text-[var(--amber)]" />
            </div>
            <Link href="/contest" className="vo-btn vo-btn-amber w-full justify-center">
              출품하기
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </aside>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="app-card p-5">
            <div className="metric-label">{item.label}</div>
            <div className="metric-value mt-4 text-[34px] leading-none">{item.value}</div>
            <div className="mt-3 text-xs text-[var(--ink-3)]">{item.meta}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="app-card p-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="label-mono">Active Projects</div>
              <h2 className="h-2 mt-2">작업 중인 곡</h2>
            </div>
            <Link href="/creator-studio" className="text-xs font-medium text-[var(--amber-d)]">
              전체 보기
            </Link>
          </div>
          <div className="space-y-3">
            {projects.map((project) => (
              <Link
                key={project.title}
                href="/creator-studio"
                className="grid gap-4 rounded-[14px] border border-[var(--line)] bg-[var(--card)] p-3 transition-colors hover:border-[var(--amber-l)] md:grid-cols-[96px_1fr_auto]"
              >
                <div className={`ph ${project.accent} h-20 text-[var(--paper)]`}>Artwork</div>
                <div className="min-w-0 py-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-medium text-[var(--ink-0)]">{project.title}</h3>
                    <span className="vo-tag">{project.type}</span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--ink-2)]">{project.state}</p>
                  <div className="mt-4 max-w-[360px]">
                    <div className="vo-progress">
                      <span style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 md:flex-col md:items-end">
                  <span className="font-mono text-sm text-[var(--ink-2)]">{project.progress}%</span>
                  <ArrowRight className="size-4 text-[var(--ink-3)]" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="app-card p-6">
          <div className="label-mono">Activity</div>
          <h2 className="h-2 mt-2">오늘의 업데이트</h2>
          <div className="mt-6 space-y-4">
            {activity.map(({ title, time, icon: Icon }) => (
              <div key={title} className="flex gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--tint)] text-[var(--ink-2)]">
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--ink-0)]">{title}</p>
                  <p className="mt-0.5 text-xs text-[var(--ink-3)]">{time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
