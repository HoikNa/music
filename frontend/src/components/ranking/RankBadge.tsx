import { Award } from "lucide-react"

interface RankBadgeProps {
  rank: number
}

const MEDALS: Record<number, { label: string; color: string }> = {
  1: { label: "1", color: "#ffb547" },
  2: { label: "2", color: "#8e8e93" },
  3: { label: "3", color: "#c8844a" },
}

export function RankBadge({ rank }: RankBadgeProps) {
  const medal = MEDALS[rank]
  if (medal) {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-black" style={{ color: medal.color }}>
        <Award className="size-4" />
        {medal.label}
      </span>
    )
  }
  return (
    <span className="text-sm font-bold tabular-nums w-6 text-center text-[var(--text-muted)]">
      {rank}
    </span>
  )
}
