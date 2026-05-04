import { ArrowRight, AudioWaveform, Mic2, Play, Radio, Save, Scissors } from "lucide-react"

const tracks = [
  { name: "Lead Vocal", state: "Take 04", width: "82%" },
  { name: "Piano", state: "Soft room", width: "64%" },
  { name: "Strings", state: "Verse only", width: "48%" },
  { name: "Drum bus", state: "Muted", width: "36%" },
]

export default function CreatorStudioPage() {
  return (
    <div className="mx-auto max-w-[1180px] space-y-8">
      <section className="app-card-lift p-7 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <span className="vo-tag vo-tag-amber">Creator Studio</span>
            <h1 className="h-display mt-6">
              서울의 밤 <em>v.3</em>
            </h1>
            <p className="mt-3 text-sm text-[var(--ink-2)]">78% complete · 자동 저장됨 · 2시간 전</p>
          </div>
          <div className="flex gap-3">
            <button className="vo-btn vo-btn-ghost">
              <Save className="size-4" />
              저장
            </button>
            <button className="vo-btn vo-btn-primary">
              <Play className="size-4" />
              재생
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="rounded-[18px] border border-[var(--line)] bg-[var(--tint)] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="label-mono">Arrangement Timeline</div>
              <div className="font-mono text-xs text-[var(--ink-3)]">03:42</div>
            </div>
            <div className="space-y-3">
              {tracks.map((track) => (
                <div key={track.name} className="grid grid-cols-[112px_1fr] items-center gap-4">
                  <div>
                    <div className="text-xs font-medium text-[var(--ink-0)]">{track.name}</div>
                    <div className="text-[11px] text-[var(--ink-3)]">{track.state}</div>
                  </div>
                  <div className="h-10 rounded-[8px] border border-[var(--line)] bg-[var(--card)] p-1.5">
                    <div className="h-full rounded-[6px] bg-[var(--ink-0)]" style={{ width: track.width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[18px] border border-[var(--line)] bg-[var(--card)] p-5">
            <div className="label-mono">Session Notes</div>
            <div className="mt-5 space-y-4 text-sm leading-6 text-[var(--ink-2)]">
              <p>후렴 전 호흡을 한 박자 더 남기면 가사 전달력이 좋아집니다.</p>
              <p>두 번째 벌스는 피아노를 줄이고 스트링을 뒤에서만 받치세요.</p>
            </div>
            <button className="vo-btn vo-btn-amber mt-6 w-full justify-center">
              AI 믹스 제안
              <ArrowRight className="size-4" />
            </button>
          </aside>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {[
          { label: "Tempo", value: "92 BPM", icon: Radio },
          { label: "Key", value: "A minor", icon: AudioWaveform },
          { label: "Vocal", value: "Take 04", icon: Mic2 },
          { label: "Edit", value: "12 cuts", icon: Scissors },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="app-card p-5">
            <Icon className="size-4 text-[var(--amber)]" />
            <div className="metric-label mt-4">{label}</div>
            <div className="mt-2 text-sm font-medium text-[var(--ink-0)]">{value}</div>
          </div>
        ))}
      </section>
    </div>
  )
}
