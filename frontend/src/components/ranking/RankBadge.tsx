interface RankBadgeProps {
  rank: number
}

const MEDALS: Record<number, { label: string; style: React.CSSProperties }> = {
  1: { label: "🥇", style: { color: "#FFD700" } },
  2: { label: "🥈", style: { color: "#C0C0C0" } },
  3: { label: "🥉", style: { color: "#CD7F32" } },
}

export function RankBadge({ rank }: RankBadgeProps) {
  const medal = MEDALS[rank]
  if (medal) {
    return <span className="text-xl" style={medal.style}>{medal.label}</span>
  }
  return (
    <span className="text-sm font-bold tabular-nums w-6 text-center text-[var(--text-muted)]">
      {rank}
    </span>
  )
}
