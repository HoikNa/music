import { ArrowRight, CheckCircle2, Globe2, ShieldCheck, Upload } from "lucide-react"

const stores = ["Spotify", "Apple Music", "YouTube Music", "Melon", "Genie", "Bugs"]

export default function DistributionPage() {
  return (
    <div className="mx-auto max-w-[1180px] space-y-8">
      <section className="app-card-lift p-7 md:p-8">
        <span className="vo-tag vo-tag-amber">Distribution</span>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <h1 className="h-display">
              발매 준비를 <em>한 화면</em>에서 끝냅니다
            </h1>
            <p className="mt-4 max-w-[620px] text-sm leading-6 text-[var(--ink-2)]">
              음원, 커버, 권리자 정보, 정산 계좌, 스토어별 공개일을 발매 패키지로 묶어 관리합니다.
            </p>
            <button className="vo-btn vo-btn-primary mt-7">
              <Upload className="size-4" />
              새 릴리즈 만들기
            </button>
          </div>
          <div className="rounded-[18px] border border-[var(--line)] bg-[var(--tint)] p-5">
            <div className="label-mono">Next Release</div>
            <h2 className="h-2 mt-4">서울의 밤</h2>
            <p className="mt-2 text-sm text-[var(--ink-2)]">2026.05.22 · Single</p>
            <div className="vo-progress mt-6 h-[3px]">
              <span style={{ width: "72%" }} />
            </div>
            <div className="mt-3 text-xs text-[var(--ink-3)]">메타데이터 72% 완료</div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="app-card p-6">
          <div className="label-mono">Rights</div>
          <div className="mt-5 space-y-3">
            {[
              "작사 · 김서연 100%",
              "작곡 · 김서연 70% / AI Assistant 30%",
              "실연 · Vocal Take 04",
              "ISRC 발급 대기",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-[12px] border border-[var(--line)] p-4 text-sm text-[var(--ink-1)]">
                <ShieldCheck className="size-4 text-[var(--amber)]" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="app-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="label-mono">Store Delivery</div>
              <h2 className="h-2 mt-2">배포 채널</h2>
            </div>
            <Globe2 className="size-5 text-[var(--ink-3)]" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {stores.map((store) => (
              <div key={store} className="flex items-center justify-between rounded-[12px] border border-[var(--line)] p-4">
                <span className="text-sm font-medium text-[var(--ink-0)]">{store}</span>
                <CheckCircle2 className="size-4 text-[var(--good)]" />
              </div>
            ))}
          </div>
          <button className="vo-btn vo-btn-ghost mt-5">
            전체 채널 설정
            <ArrowRight className="size-4" />
          </button>
        </div>
      </section>
    </div>
  )
}
