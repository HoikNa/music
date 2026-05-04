import { ArrowRight, CheckCircle2, Clock3, Trophy, Upload, Users } from "lucide-react"

const entries = [
  ["한강 블루스", "Ready", "91.2"],
  ["서울의 밤", "Mix review", "88.4"],
  ["Blue Hour", "Submitted", "86.9"],
]

export default function ContestPage() {
  return (
    <div className="mx-auto max-w-[1180px] space-y-8">
      <section className="app-card-lift grid overflow-hidden lg:grid-cols-[1fr_340px]">
        <div className="p-7 md:p-8">
          <span className="vo-tag vo-tag-amber">Spring 2026 Contest · D-7</span>
          <h1 className="h-display mt-6">
            한강의 밤을 들려줄 <em>다음 곡</em>을 고르세요
          </h1>
          <p className="mt-4 max-w-[620px] text-sm leading-6 text-[var(--ink-2)]">
            제출 전 자동 심사, 권리 메타데이터, 커버 이미지 상태를 한 번에 점검합니다.
          </p>
          <button className="vo-btn vo-btn-primary mt-7">
            <Upload className="size-4" />
            출품 패키지 만들기
          </button>
        </div>
        <div className="border-t border-[var(--line)] bg-[var(--tint)] p-6 lg:border-l lg:border-t-0">
          <div className="app-card h-full p-5">
            <Trophy className="size-7 text-[var(--amber)]" />
            <div className="metric-label mt-6">Prize Pool</div>
            <div className="metric-value mt-2 text-5xl">₩12M</div>
            <p className="mt-4 text-sm leading-6 text-[var(--ink-2)]">상위 12곡은 공식 플레이리스트와 라이브 쇼케이스에 연결됩니다.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="app-card p-6">
          <div className="label-mono">Candidate Tracks</div>
          <div className="mt-5 space-y-3">
            {entries.map(([title, status, score]) => (
              <div key={title} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-[12px] border border-[var(--line)] p-4">
                <div>
                  <div className="text-sm font-medium text-[var(--ink-0)]">{title}</div>
                  <div className="text-xs text-[var(--ink-3)]">{status}</div>
                </div>
                <div className="font-mono text-sm text-[var(--amber-d)]">{score}</div>
                <ArrowRight className="size-4 text-[var(--ink-3)]" />
              </div>
            ))}
          </div>
        </div>

        <div className="app-card p-6">
          <div className="label-mono">Checklist</div>
          <div className="mt-5 space-y-4">
            {[
              { text: "음원 파일 검수 완료", icon: CheckCircle2 },
              { text: "커버 이미지 3000px 확인", icon: CheckCircle2 },
              { text: "제출 마감까지 7일", icon: Clock3 },
              { text: "현재 참가자 1,284명", icon: Users },
            ].map(({ text, icon: Icon }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-[var(--ink-1)]">
                <Icon className="size-4 text-[var(--amber)]" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
