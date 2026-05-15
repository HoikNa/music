"use client"

import Image from "next/image"
import { useState } from "react"
import { Play, Heart, Search } from "lucide-react"
import { mockWeeklyRanking } from "@/lib/mocks/data"
import { MUSIC_GENRE_FILTERS, musicGenreLabel } from "@/lib/musicGenres"

function CoverCard({ url, title, artist, genre, score }: {
  url?: string | null; title: string; artist: string; genre?: string; score: number
}) {
  if (url) {
    return (
      <div className="group relative">
        <div className="relative mb-2 aspect-square overflow-hidden rounded">
          <Image src={url} alt={title} fill className="object-cover" unoptimized />
          <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/40 transition-all">
            <button className="size-10 rounded-full bg-white flex items-center justify-center shadow-md">
              <Play className="size-5 fill-current text-[var(--green-d)] ml-0.5" />
            </button>
          </div>
        </div>
        <p className="text-[13px] font-medium truncate">{title}</p>
        <p className="text-[12px] text-[var(--ink-3)] truncate">{artist}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] text-[var(--ink-4)]">{genre}</span>
          <span className="text-[11px] font-bold text-[var(--green-d)]">{score.toFixed(1)}</span>
        </div>
      </div>
    )
  }
  const colors = ["#6366f1,#8b5cf6","#06b6d4,#0284c7","#10b981,#059669","#f59e0b,#d97706","#00c73c,#006620","#ef4444,#dc2626"]
  const idx = title.charCodeAt(0) % colors.length
  const [from, to] = colors[idx].split(",")
  return (
    <div className="group">
      <div className="relative mb-2 aspect-square overflow-hidden rounded" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
        <div className="absolute inset-0 flex items-center justify-center text-white text-[18px] font-black">
          {title.slice(0, 2)}
        </div>
        <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/30">
          <button className="size-10 rounded-full bg-white flex items-center justify-center shadow-md">
            <Play className="size-5 fill-current text-[var(--green-d)] ml-0.5" />
          </button>
        </div>
      </div>
      <p className="text-[13px] font-medium truncate">{title}</p>
      <p className="text-[12px] text-[var(--ink-3)] truncate">{artist}</p>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[11px] text-[var(--ink-4)]">{genre}</span>
        <span className="text-[11px] font-bold text-[var(--green-d)]">{score.toFixed(1)}</span>
      </div>
    </div>
  )
}

export default function ExplorePage() {
  const [genre, setGenre] = useState("all")
  const songs = genre === "all"
    ? mockWeeklyRanking.entries
    : mockWeeklyRanking.entries.filter((entry) => entry.genre === genre)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[20px] font-black">최신음악</h1>
        <div className="flex items-center gap-2 rounded border border-[var(--line)] bg-[var(--tint)] px-3 h-9 focus-within:border-[var(--green)] focus-within:bg-[var(--card)] w-64 transition-colors">
          <Search className="size-4 text-[var(--ink-3)] shrink-0" />
          <input className="w-full bg-transparent text-[13px] outline-none placeholder:text-[var(--ink-3)]"
            placeholder="곡명, 아티스트 검색" />
        </div>
      </div>

      {/* Genre filter */}
      <div className="flex gap-1.5 flex-wrap">
        {MUSIC_GENRE_FILTERS.map((g) => (
          <button
            key={g.code}
            type="button"
            onClick={() => setGenre(g.code)}
            className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
              genre === g.code
                ? "border-[var(--green)] bg-[var(--green-bg)] text-[var(--green-d)]"
                : "border-[var(--line)] text-[var(--ink-2)] hover:border-[var(--green)] hover:text-[var(--green-d)]"
            }`}>
            {g.label}
          </button>
        ))}
      </div>

      {/* Songs grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-bold text-[var(--ink-1)]">이번 주 인기곡</h2>
          <div className="flex items-center gap-2 text-[12px] text-[var(--ink-3)]">
            <Heart className="size-3.5" />
            <span>{songs.reduce((a, e) => a + (e.like_count ?? 0), 0).toLocaleString()} 총 좋아요</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {songs.map((e) => (
            <CoverCard
              key={e.submission_id}
              url={e.cover_image_url}
              title={e.title}
              artist={e.nickname}
              genre={e.genre_label ?? musicGenreLabel(e.genre)}
              score={e.score}
            />
          ))}
        </div>
      </div>

      {/* New arrivals list */}
      <div>
        <h2 className="text-[14px] font-bold text-[var(--ink-1)] mb-3">신규 제출곡</h2>
        <div className="border border-[var(--line)] rounded overflow-hidden">
          {songs.slice(0, 10).map((e, i) => (
            <div key={e.submission_id}
              className="flex items-center gap-3 px-4 py-3 border-b border-[var(--line-soft)] hover:bg-[var(--tint)] transition-colors last:border-0">
              <span className="w-5 text-[13px] text-[var(--ink-4)] tabular-nums text-center">{i + 1}</span>
              <div className="relative size-10 shrink-0">
                {e.cover_image_url ? (
                  <Image src={e.cover_image_url} alt={e.title} fill className="rounded object-cover" unoptimized />
                ) : (
                  <div className="size-10 rounded bg-[var(--tint)] flex items-center justify-center text-[11px] font-bold text-[var(--ink-3)]">
                    {e.title.slice(0, 2)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate">{e.title}</p>
                <p className="text-[12px] text-[var(--ink-3)] truncate">{e.nickname} · {e.genre_label ?? musicGenreLabel(e.genre)}</p>
              </div>
              <div className="flex items-center gap-3 text-[12px] text-[var(--ink-3)] shrink-0">
                <span className="flex items-center gap-1"><Heart className="size-3" />{(e.like_count ?? 0).toLocaleString()}</span>
                <span className="font-bold text-[var(--green-d)]">{e.score.toFixed(1)}</span>
                <button className="flex size-7 items-center justify-center rounded-full hover:bg-[var(--tint)] transition-colors">
                  <Play className="size-3.5 fill-current" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
