import { ChevronRight, Clock3, Trophy, Upload, Users } from "lucide-react"
import { mockWeeklyRanking } from "@/lib/mocks/data"

const CONTESTS = [
  { id: 1, title: "Spring 2026 보컬 챔피언십", genre: "전체", deadline: "D-7", prize: "12,000,000", participants: 1284, status: "진행중" },
  { id: 2, title: "발라드 클래식 경연", genre: "발라드", deadline: "D-14", prize: "5,000,000", participants: 831, status: "진행중" },
  { id: 3, title: "R&B 소울 페스티벌", genre: "R&B", deadline: "D-21", prize: "3,000,000", participants: 447, status: "모집중" },
  { id: 4, title: "인디 뮤직 위크", genre: "인디", deadline: "D-28", prize: "2,000,000", participants: 203, status: "모집중" },
]

export default function ContestPage() {
  const entries = mockWeeklyRanking.entries.slice(0, 8)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-black">경연</h1>
        <button className="flex items-center gap-2 rounded bg-[var(--green)] text-white text-[13px] font-semibold px-4 py-2 hover:bg-[var(--green-d)] transition-colors">
          <Upload className="size-4" />출품 신청
        </button>
      </div>

      {/* Contest banner grid */}
      <div className="grid md:grid-cols-2 gap-3">
        {CONTESTS.map((c) => (
          <div key={c.id} className="border border-[var(--line)] rounded overflow-hidden hover:border-[var(--green)] transition-colors cursor-pointer">
            {/* Banner top */}
            <div className="h-28 bg-gradient-to-r from-[#001a0d] to-[#003319] flex items-center px-5 gap-4">
              <div className="size-10 rounded-full bg-[var(--green)] flex items-center justify-center shrink-0">
                <Trophy className="size-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.status === "진행중" ? "bg-[var(--green)] text-white" : "bg-white/20 text-white"}`}>
                    {c.status}
                  </span>
                  <span className="text-[11px] text-white/60">{c.deadline}</span>
                </div>
                <p className="text-[15px] font-bold text-white leading-snug">{c.title}</p>
              </div>
            </div>
            {/* Info row */}
            <div className="flex items-center justify-between px-5 py-3 bg-[var(--tint)]">
              <div className="flex items-center gap-4 text-[12px] text-[var(--ink-2)]">
                <span className="flex items-center gap-1.5"><Users className="size-3.5" />{c.participants.toLocaleString()}명 참가</span>
                <span className="flex items-center gap-1.5"><Clock3 className="size-3.5" />마감 {c.deadline}</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[var(--ink-3)]">상금</p>
                <p className="text-[14px] font-black text-[var(--green-d)]">₩{parseInt(c.prize).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Featured contest detail */}
      <div className="border border-[var(--line)] rounded overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--line)] bg-[var(--tint)]">
          <div>
            <h2 className="text-[14px] font-bold">Spring 2026 보컬 챔피언십</h2>
            <p className="text-[12px] text-[var(--ink-3)]">현재 참가곡 TOP 8</p>
          </div>
          <button className="flex items-center gap-1 text-[12px] text-[var(--green)] font-medium hover:text-[var(--green-d)]">
            전체 보기 <ChevronRight className="size-3.5" />
          </button>
        </div>

        {/* Column header */}
        <div className="grid items-center px-5 py-2 gap-3 bg-white border-b border-[var(--line)] text-[11px] font-medium text-[var(--ink-3)] uppercase tracking-wide"
          style={{ gridTemplateColumns: "32px 1fr 64px 56px 80px" }}>
          <span className="text-center">순위</span>
          <span>곡명 / 참가자</span>
          <span className="hidden sm:block">장르</span>
          <span className="text-right pr-2">점수</span>
          <span />
        </div>

        {entries.map((e) => (
          <div key={e.submission_id}
            className="grid items-center px-5 py-3 gap-3 border-b border-[var(--line-soft)] hover:bg-[var(--tint)] transition-colors last:border-0"
            style={{ gridTemplateColumns: "32px 1fr 64px 56px 80px" }}>
            <span className={`text-[14px] font-black tabular-nums text-center ${e.rank <= 3 ? "text-[var(--green)]" : "text-[var(--ink-3)]"}`}>
              {e.rank}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-medium truncate">{e.title}</p>
              <p className="text-[12px] text-[var(--ink-3)] truncate">{e.nickname}</p>
            </div>
            <span className="hidden sm:block text-[12px] text-[var(--ink-3)] truncate">{e.genre}</span>
            <span className="text-[13px] font-bold text-[var(--green-d)] tabular-nums text-right pr-2">
              {e.score.toFixed(1)}
            </span>
            <div className="flex items-center gap-1 justify-end">
              <button className="flex items-center gap-1 text-[12px] font-medium rounded border border-[var(--line)] px-2.5 h-7 hover:border-[var(--green)] hover:text-[var(--green-d)] transition-colors">
                상세
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
