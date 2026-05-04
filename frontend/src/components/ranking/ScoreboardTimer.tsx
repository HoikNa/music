"use client"

import { useEffect, useState } from "react"

interface ScoreboardTimerProps {
  endAt: string
}

function getRemaining(endAt: string) {
  const diff = new Date(endAt).getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  const s = Math.floor(diff / 1000)
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
}

export function ScoreboardTimer({ endAt }: ScoreboardTimerProps) {
  const [rem, setRem] = useState(getRemaining(endAt))

  useEffect(() => {
    const id = setInterval(() => setRem(getRemaining(endAt)), 1000)
    return () => clearInterval(id)
  }, [endAt])

  const pad = (n: number) => String(n).padStart(2, "0")

  return (
    <div className="flex items-center gap-1 text-sm font-mono">
      <span className="text-[var(--text-muted)] text-xs mr-1">마감까지</span>
      {rem.days > 0 && <span className="font-bold">{rem.days}일</span>}
      <span className="font-bold tabular-nums" style={{ color: rem.hours < 1 ? "var(--error)" : "var(--accent)" }}>
        {pad(rem.hours)}:{pad(rem.minutes)}:{pad(rem.seconds)}
      </span>
    </div>
  )
}
