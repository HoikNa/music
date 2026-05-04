import { RankBadge } from "./RankBadge"
import type { RankingEntry } from "@/types/api"
import { cn } from "@/lib/utils"

interface RankingRowProps {
  entry: RankingEntry
  isMe?: boolean
}

export function RankingRow({ entry, isMe = false }: RankingRowProps) {
  const change = entry.rank_change
  const changeLabel = change > 0 ? `▲${change}` : change < 0 ? `▼${Math.abs(change)}` : "-"
  const changeColor = change > 0 ? "var(--success)" : change < 0 ? "var(--error)" : "var(--text-disabled)"

  return (
    <div className={cn(
      "flex items-center gap-4 px-4 py-3 rounded-lg transition-colors",
      isMe ? "border border-[var(--brand)] bg-[var(--brand-bg)]/10" : "hover:bg-[var(--secondary)]"
    )}>
      <div className="w-8 flex justify-center shrink-0">
        <RankBadge rank={entry.rank} />
      </div>
      <div className="w-8 text-xs text-center tabular-nums shrink-0" style={{ color: changeColor }}>
        {changeLabel}
      </div>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: isMe ? "var(--brand)" : "var(--secondary)" }}>
        {entry.nickname[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {entry.nickname}
          {isMe && <span className="ml-2 text-xs font-normal" style={{ color: "var(--brand)" }}>나</span>}
        </p>
        <p className="text-xs text-[var(--text-muted)] truncate">{entry.title}</p>
      </div>
      <div className="text-base font-bold tabular-nums shrink-0" style={{ color: "var(--accent)" }}>
        {entry.score.toFixed(1)}
      </div>
    </div>
  )
}
