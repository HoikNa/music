"use client"

import Image from "next/image"
import { Heart, Play, Plus } from "lucide-react"
import { RankBadge } from "./RankBadge"
import type { RankingEntry } from "@/types/api"
import { musicGenreLabel } from "@/lib/musicGenres"
import { cn } from "@/lib/utils"

interface RankingRowProps {
  entry: RankingEntry
  isMe?: boolean
  selected?: boolean
  onSelect?: () => void
}

function RankChange({ change }: { change: number }) {
  if (change === 0) return <span className="rank-same text-xs tabular-nums">-</span>
  if (change > 0) return <span className="rank-up text-xs tabular-nums font-medium">▲{change}</span>
  return <span className="rank-down text-xs tabular-nums font-medium">▼{Math.abs(change)}</span>
}

function CoverArt({ url, title }: { url?: string | null; title: string }) {
  if (url) {
    return (
      <Image
        src={url}
        alt={title}
        width={40}
        height={40}
        className="rounded object-cover shrink-0"
        unoptimized
      />
    )
  }
  const colors = ["#6366f1,#8b5cf6","#06b6d4,#0284c7","#10b981,#059669","#f59e0b,#d97706","#ef4444,#dc2626","#00c73c,#006620"]
  const idx = title.charCodeAt(0) % colors.length
  const [from, to] = colors[idx].split(",")
  return (
    <div
      className="size-10 rounded shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {title.slice(0, 2)}
    </div>
  )
}

export function RankingRow({ entry, isMe = false, selected = false, onSelect }: RankingRowProps) {
  const likeStr = entry.like_count != null
    ? entry.like_count >= 10000
      ? `${(entry.like_count / 10000).toFixed(1)}만`
      : entry.like_count.toLocaleString()
    : ""

  return (
    <div className={cn(
      "chart-row grid items-center px-3 py-2 gap-2",
      "grid-cols-[24px_40px_36px_40px_1fr_64px_56px_80px_auto]",
      isMe && "bg-[var(--green-bg)]",
      selected && "bg-[var(--tint)]",
    )}>
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={onSelect}
        className="size-4 accent-[var(--green)] cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Rank */}
      <div className="flex justify-center">
        <RankBadge rank={entry.rank} />
      </div>

      {/* Change */}
      <div className="flex justify-center">
        <RankChange change={entry.rank_change} />
      </div>

      {/* Cover */}
      <CoverArt url={entry.cover_image_url} title={entry.title} />

      {/* Title + artist */}
      <div className="min-w-0">
        <p className={cn("text-[13px] font-medium truncate", isMe && "text-[var(--green-d)]")}>
          {entry.title}
          {isMe && <span className="ml-1.5 text-[11px] font-normal text-[var(--green)] bg-[var(--green-bg)] px-1 rounded">나</span>}
        </p>
        <p className="text-[12px] text-[var(--ink-3)] truncate">{entry.nickname}</p>
      </div>

      {/* Genre */}
      <div className="hidden md:block text-[12px] text-[var(--ink-3)] truncate">
        {entry.genre_label ?? musicGenreLabel(entry.genre)}
      </div>

      {/* Score */}
      <div className="text-[13px] font-bold tabular-nums text-[var(--green-d)] text-right pr-2">
        {entry.score.toFixed(1)}
      </div>

      {/* Like count */}
      <div className="hidden lg:flex items-center gap-1 text-[12px] text-[var(--ink-3)] tabular-nums">
        <Heart className="size-3 shrink-0" />
        {likeStr}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button className="flex size-7 items-center justify-center rounded-full hover:bg-[var(--tint)] text-[var(--ink-2)] transition-colors" title="재생">
          <Play className="size-3.5 fill-current" />
        </button>
        <button className="flex size-7 items-center justify-center rounded-full hover:bg-[var(--tint)] text-[var(--ink-2)] transition-colors" title="담기">
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
