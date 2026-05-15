import Link from "next/link"
import Image from "next/image"
import { ChevronRight, Play, Trophy } from "lucide-react"
import { HomeHero } from "@/components/home/HomeHero"
import { HomeSubmitCta } from "@/components/home/HomeSubmitCta"
import { HomeHeader } from "@/components/layout/HomeHeader"
import { mockWeeklyRanking } from "@/lib/mocks/data"

function CoverThumb({ url, title, size = 48 }: { url?: string | null; title: string; size?: number }) {
  if (url) {
    return (
      <Image src={url} alt={title} width={size} height={size}
        className="rounded object-cover shrink-0" unoptimized />
    )
  }
  const colors = ["#6366f1,#8b5cf6","#06b6d4,#0284c7","#10b981,#059669","#f59e0b,#d97706","#00c73c,#006620","#ef4444,#dc2626"]
  const idx = title.charCodeAt(0) % colors.length
  const [from, to] = colors[idx].split(",")
  return (
    <div className="rounded shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${from}, ${to})` }}>
      {title.slice(0, 2)}
    </div>
  )
}

export default function HomePage() {
  const top10 = mockWeeklyRanking.entries.slice(0, 10)

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--foreground)]">
      <HomeHeader />

      {/* === Hero banner === */}
      <section className="border-b border-[var(--line)] bg-[linear-gradient(135deg,#07130b_0%,#0d1512_48%,#031008_100%)] text-white">
        <div className="mx-auto max-w-[1200px] px-4 py-12 flex items-center justify-between gap-8">
          <HomeHero />
          <div className="hidden lg:grid grid-cols-3 gap-2 shrink-0">
            {top10.slice(0, 6).map((e) => (
              <CoverThumb key={e.submission_id} url={e.cover_image_url} title={e.title} size={72} />
            ))}
          </div>
        </div>
      </section>

      {/* === Main content === */}
      <div className="mx-auto max-w-[1200px] px-4 py-6 grid lg:grid-cols-[1fr_320px] gap-6">

        {/* LEFT: latest songs grid */}
        <div className="space-y-6">
          {/* Latest songs */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-bold">최신 제출곡</h2>
              <Link href="/explore" className="flex items-center gap-0.5 text-[12px] text-[var(--ink-3)] hover:text-[var(--green)]">
                더보기 <ChevronRight className="size-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {top10.slice(0, 8).map((e) => (
                <Link href="/explore" key={e.submission_id}
                  className="group block hover:bg-[var(--tint)] rounded p-2 transition-colors">
                  <div className="relative mb-2">
                    <CoverThumb url={e.cover_image_url} title={e.title} size={120} />
                    <div className="absolute inset-0 hidden group-hover:flex items-center justify-center rounded bg-black/30">
                      <Play className="size-6 text-white fill-current" />
                    </div>
                  </div>
                  <p className="text-[13px] font-medium truncate">{e.title}</p>
                  <p className="text-[12px] text-[var(--ink-3)] truncate">{e.nickname}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* AI judge banner */}
          <section className="rounded border border-[rgba(0,224,84,0.45)] bg-[linear-gradient(135deg,rgba(0,224,84,0.16),rgba(17,21,25,0.92))] p-5 flex items-center gap-5 shadow-[var(--sh-sm)]">
            <div className="size-12 rounded-full bg-[var(--green)] flex items-center justify-center shrink-0 shadow-[0_0_24px_rgba(0,224,84,0.22)]">
              <Trophy className="size-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-[var(--green-d)]">페르소나 AI 심사 오픈</p>
              <p className="text-[13px] text-[var(--ink-2)] mt-0.5">김범수 · 아이유 · 태양 · 선미 — 나만의 심사위원단을 구성해 보세요</p>
            </div>
            <Link href="/submit"
              className="rounded text-[13px] font-semibold bg-[var(--green)] text-white px-4 py-2 hover:bg-[var(--green-d)] transition-colors shrink-0">
              심사 받기
            </Link>
          </section>

          {/* Contest notice */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-bold">진행 중인 경연</h2>
              <Link href="/contest" className="flex items-center gap-0.5 text-[12px] text-[var(--ink-3)] hover:text-[var(--green)]">
                전체 보기 <ChevronRight className="size-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {[
                { title: "Spring 2026 보컬 챔피언십", deadline: "D-7", prize: "₩12,000,000", genre: "전체" },
                { title: "Pop / Pop Ballard 경연", deadline: "D-14", prize: "₩5,000,000", genre: "Pop / Pop Ballard" },
                { title: "R&B / Soul 페스티벌", deadline: "D-21", prize: "₩3,000,000", genre: "R&B / Soul" },
              ].map((c) => (
                <Link key={c.title} href="/contest"
                  className="flex items-center gap-3 rounded border border-[var(--line)] p-3 hover:border-[var(--green)] hover:bg-[var(--green-bg)] transition-colors">
                  <div className="size-8 rounded bg-[var(--tint)] flex items-center justify-center text-[10px] font-bold text-[var(--green-d)]">
                    {c.deadline}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{c.title}</p>
                    <p className="text-[12px] text-[var(--ink-3)]">{c.genre} · 상금 {c.prize}</p>
                  </div>
                  <ChevronRight className="size-4 text-[var(--ink-4)] shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT: mini chart */}
        <aside className="space-y-4">
          <div className="border border-[var(--line)] rounded overflow-hidden bg-[var(--card)] shadow-[var(--sh-sm)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)] bg-[var(--tint)]">
              <h2 className="text-[14px] font-bold">주간 TOP 10</h2>
              <Link href="/rankings" className="flex items-center gap-0.5 text-[12px] text-[var(--green)] font-medium">
                TOP100 <ChevronRight className="size-3.5" />
              </Link>
            </div>
            <div>
              {top10.map((entry) => (
                <div key={entry.submission_id}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--line-soft)] hover:bg-[var(--tint)] transition-colors">
                  <span className={`w-5 text-[13px] font-black tabular-nums shrink-0 text-center ${entry.rank <= 3 ? "text-[var(--green)]" : "text-[var(--ink-3)]"}`}>
                    {entry.rank}
                  </span>
                  <CoverThumb url={entry.cover_image_url} title={entry.title} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate">{entry.title}</p>
                    <p className="text-[11px] text-[var(--ink-3)] truncate">{entry.nickname}</p>
                  </div>
                  <span className="text-[11px] font-bold text-[var(--green-d)] tabular-nums shrink-0">
                    {entry.score.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <HomeSubmitCta />
        </aside>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] py-6 px-4 text-center text-[12px] text-[var(--ink-4)]">
        © 2026 Vertual Owl. All rights reserved.
      </footer>
    </div>
  )
}
