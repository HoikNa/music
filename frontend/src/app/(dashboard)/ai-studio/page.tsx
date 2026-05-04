import {
  Disc3,
  Mic2,
  Play,
  Plus,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react"

const presets = [
  { title: "K-Indie Ballad", tone: "warm vocal · sparse piano", level: "78%" },
  { title: "City Pop Night", tone: "bright bass · analog pad", level: "64%" },
  { title: "Minimal R&B", tone: "soft drum · close mic", level: "51%" },
]

export default function AiStudioPage() {
  return (
    <div className="mx-auto max-w-[1180px] space-y-8">
      <section className="app-card-lift grid overflow-hidden lg:grid-cols-[0.95fr_1.05fr]">
        <div className="p-7 md:p-8">
          <span className="vo-tag vo-tag-amber">AI Studio</span>
          <h1 className="h-display mt-6">
            아이디어를 <em>첫 번째 데모</em>로 바꾸는 작곡실
          </h1>
          <p className="mt-4 max-w-[560px] text-sm leading-6 text-[var(--ink-2)]">
            장르, 보컬 톤, 레퍼런스 무드를 조합해 멜로디와 편곡 초안을 생성합니다.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button className="vo-btn vo-btn-primary">
              <Sparkles className="size-4" />
              새 생성 시작
            </button>
            <button className="vo-btn vo-btn-ghost">
              <Play className="size-4" />
              최근 결과 재생
            </button>
          </div>
        </div>
        <div className="border-t border-[var(--line)] bg-[var(--tint)] p-6 lg:border-l lg:border-t-0">
          <div className="ph ph-k2 h-full min-h-[280px] rounded-[18px] text-[var(--paper)]">Waveform Preview</div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="app-card p-6">
          <div className="label-mono">Prompt Composer</div>
          <div className="mt-5 grid gap-3">
            {[
              ["Theme", "늦은 밤 한강을 걷는 두 사람의 담담한 고백"],
              ["Genre", "K-Indie Ballad · 92 BPM"],
              ["Vocal", "Female alto · breathy but clear"],
              ["Reference", "Warm piano, restrained strings, room ambience"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[12px] border border-[var(--line)] bg-[var(--card)] p-4">
                <div className="label-mono">{label}</div>
                <div className="mt-2 text-sm text-[var(--ink-0)]">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="app-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="label-mono">Preset Bank</div>
              <h2 className="h-2 mt-2">추천 사운드</h2>
            </div>
            <button className="flex size-9 items-center justify-center rounded-full border border-[var(--line)]">
              <Plus className="size-4" />
            </button>
          </div>
          <div className="space-y-3">
            {presets.map((preset) => (
              <div key={preset.title} className="flex items-center gap-3 rounded-[12px] border border-[var(--line)] p-3">
                <div className="flex size-10 items-center justify-center rounded-[10px] bg-[var(--tint)] text-[var(--ink-2)]">
                  <Disc3 className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[var(--ink-0)]">{preset.title}</div>
                  <div className="text-xs text-[var(--ink-3)]">{preset.tone}</div>
                </div>
                <div className="font-mono text-xs text-[var(--ink-3)]">{preset.level}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Model", value: "Melody v3.2", icon: Sparkles },
          { label: "Input", value: "Voice memo + text", icon: Mic2 },
          { label: "Control", value: "Structure locked", icon: SlidersHorizontal },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="app-card flex items-center justify-between p-5">
            <div>
              <div className="metric-label">{label}</div>
              <div className="mt-2 text-sm font-medium text-[var(--ink-0)]">{value}</div>
            </div>
            <Icon className="size-5 text-[var(--amber)]" />
          </div>
        ))}
      </section>
    </div>
  )
}
