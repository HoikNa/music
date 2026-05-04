import { ArrowRight, Compass, Headphones, Heart, MessageSquare, Search, Users } from "lucide-react"

const cards = [
  { title: "Night Walk Seoul", by: "Mira", stat: "42K" },
  { title: "River Room", by: "Han", stat: "31K" },
  { title: "Tape Ending", by: "Jin", stat: "27K" },
]

export default function ExplorePage() {
  return (
    <div className="mx-auto max-w-[1180px] space-y-8">
      <section className="app-card-lift p-7 md:p-8">
        <span className="vo-tag vo-tag-amber">Explore</span>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            <h1 className="h-display">
              오늘의 씬에서 <em>새로운 협업</em>을 찾으세요
            </h1>
            <p className="mt-4 max-w-[620px] text-sm leading-6 text-[var(--ink-2)]">
              비슷한 무드의 창작자, 열려 있는 콘테스트, 큐레이터 플레이리스트를 탐색합니다.
            </p>
          </div>
          <div className="flex h-12 items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--tint)] px-4">
            <Search className="size-4 text-[var(--ink-3)]" />
            <span className="text-sm text-[var(--ink-3)]">Search by mood, genre, creator</span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card, index) => (
            <div key={card.title} className="app-card overflow-hidden">
              <div className={`ph h-44 ${index === 0 ? "ph-k1" : index === 1 ? "ph-k2" : "ph-k3"} ${index < 2 ? "text-[var(--paper)]" : ""}`}>
                Cover
              </div>
              <div className="p-4">
                <h2 className="text-sm font-medium text-[var(--ink-0)]">{card.title}</h2>
                <p className="mt-1 text-xs text-[var(--ink-3)]">by {card.by}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-[var(--ink-2)]">
                  <span className="inline-flex items-center gap-1">
                    <Headphones className="size-3.5" />
                    {card.stat}
                  </span>
                  <ArrowRight className="size-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="app-card p-6">
          <div className="label-mono">Community Pulse</div>
          <div className="mt-5 space-y-4">
            {[
              { label: "Open collabs", value: "184", icon: Users },
              { label: "Curator likes", value: "2.8K", icon: Heart },
              { label: "New notes", value: "73", icon: MessageSquare },
              { label: "Mood clusters", value: "12", icon: Compass },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between rounded-[12px] border border-[var(--line)] p-4">
                <span className="inline-flex items-center gap-3 text-sm text-[var(--ink-1)]">
                  <Icon className="size-4 text-[var(--amber)]" />
                  {label}
                </span>
                <span className="font-mono text-sm text-[var(--ink-0)]">{value}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  )
}
