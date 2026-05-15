"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Clock3,
  Copy,
  Disc3,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  Music2,
  Play,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Volume2,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { MUSIC_GENRES, musicGenreLabel } from "@/lib/musicGenres"
import { queryKeys } from "@/lib/queryKeys"
import type { GeneratedAsset, GeneratedAssetsResponse, PagedResponse, Submission } from "@/types/api"

const presets = [
  { title: "Pop / Pop Ballard", genre: "VOVATAR_POP_BALLARD", tone: "warm vocal · sparse piano", level: "78%" },
  { title: "Pop", genre: "VOVATAR_POP", tone: "bright bass · analog pad", level: "64%" },
  { title: "R&B / Soul", genre: "VOVATAR_RNB_SOUL", tone: "soft drum · close mic", level: "51%" },
]

function assetTypeLabel(type: GeneratedAsset["asset_type"]) {
  if (type === "lyrics") return "가사"
  if (type === "composition") return "데모"
  return "마스터링"
}

function statusLabel(status: GeneratedAsset["status"]) {
  if (status === "succeeded") return "완료"
  if (status === "skipped") return "대기"
  if (status === "failed") return "실패"
  if (status === "running") return "진행"
  return "큐"
}

function formatAssetDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function inputString(asset: GeneratedAsset, key: string) {
  const value = asset.input_data?.[key]
  return typeof value === "string" ? value : null
}

function inputNumber(asset: GeneratedAsset, key: string) {
  const value = asset.input_data?.[key]
  return typeof value === "number" ? value : null
}

function assetMetadataString(asset: GeneratedAsset, key: string) {
  const metadata = asset.input_data?.metadata
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null
  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === "string" ? value : null
}

function assetDescription(asset: GeneratedAsset) {
  const fallbackReason = assetMetadataString(asset, "fallback_reason")
  if (asset.error_message) return asset.error_message
  if (fallbackReason) return fallbackReason
  return asset.prompt ?? asset.output_text ?? "생성 기록"
}

export default function AiStudioPage() {
  const queryClient = useQueryClient()
  const [theme, setTheme] = useState("늦은 밤 한강을 걷는 두 사람의 담담한 고백")
  const [genre, setGenre] = useState("VOVATAR_POP_BALLARD")
  const [mood, setMood] = useState("warm, restrained, emotional")
  const [lyrics, setLyrics] = useState<GeneratedAsset | null>(null)
  const [composition, setComposition] = useState<GeneratedAsset | null>(null)
  const [mastering, setMastering] = useState<GeneratedAsset | null>(null)
  const [masterSourceUrl, setMasterSourceUrl] = useState("")
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("")
  const [targetLufs, setTargetLufs] = useState(-14)
  const [loadingLyrics, setLoadingLyrics] = useState(false)
  const [loadingComposition, setLoadingComposition] = useState(false)
  const [loadingMastering, setLoadingMastering] = useState(false)

  const {
    data: assetData,
    isLoading: loadingAssets,
    isFetching: fetchingAssets,
    isError: assetsError,
    refetch: refetchAssets,
  } = useQuery({
    queryKey: queryKeys.ai.assets(),
    queryFn: () => api.get<GeneratedAssetsResponse>("/ai/assets", { limit: 12 }),
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? []
      return items.some((asset) => asset.status === "queued" || asset.status === "running") ? 3000 : false
    },
  })

  const { data: submissionsData } = useQuery({
    queryKey: queryKeys.submissions.mine(),
    queryFn: () => api.get<PagedResponse<Submission>>("/submissions", { limit: 6 }),
  })

  const assets = assetData?.items ?? []
  const submissions = submissionsData?.items ?? []
  const masterableSubmissions = submissions.filter((submission) => Boolean(submission.audio_url))
  const selectedSubmission = masterableSubmissions.find((submission) => submission.id === selectedSubmissionId)
  const sourceAudioUrl = selectedSubmission?.audio_url || masterSourceUrl.trim() || composition?.output_url || ""

  async function handleLyrics() {
    setLoadingLyrics(true)
    try {
      const result = await api.post<GeneratedAsset>("/ai/lyrics", {
        theme,
        genre,
        mood,
        keywords: ["한강", "새벽", "고백"],
      })
      setLyrics(result)
      await queryClient.invalidateQueries({ queryKey: queryKeys.ai.assets() })
      toast.success("가사를 생성했습니다")
    } catch {
      toast.error("가사 생성에 실패했습니다")
    } finally {
      setLoadingLyrics(false)
    }
  }

  async function handleCompose() {
    setLoadingComposition(true)
    try {
      const result = await api.post<GeneratedAsset>("/ai/compose", {
        prompt: lyrics?.output_text ?? theme,
        genre,
        mood,
        duration_sec: 60,
      })
      setComposition(result)
      await queryClient.invalidateQueries({ queryKey: queryKeys.ai.assets() })
      if (result.status === "succeeded") {
        toast.success(result.output_url ? "데모 음원을 생성했습니다" : "데모 구성안을 생성했습니다")
      } else {
        toast.info("작곡 provider 설정이 필요합니다")
      }
    } catch {
      toast.error("작곡 요청에 실패했습니다")
    } finally {
      setLoadingComposition(false)
    }
  }

  async function handleMastering() {
    const audioUrl = selectedSubmissionId ? null : masterSourceUrl.trim() || composition?.output_url
    if (!selectedSubmissionId && !audioUrl) {
      toast.error("마스터링할 오디오를 선택해 주세요")
      return
    }

    setLoadingMastering(true)
    try {
      const result = await api.post<GeneratedAsset>("/ai/mastering", {
        audio_url: audioUrl,
        submission_id: selectedSubmissionId || null,
        target_lufs: targetLufs,
      })
      setMastering(result)
      await queryClient.invalidateQueries({ queryKey: queryKeys.ai.assets() })
      if (result.status === "succeeded") toast.success("마스터링이 완료되었습니다")
      else if (result.status === "queued" || result.status === "running") toast.success("마스터링 작업을 접수했습니다")
      else toast.error(result.error_message ?? "마스터링에 실패했습니다")
    } catch {
      toast.error("마스터링 요청에 실패했습니다")
    } finally {
      setLoadingMastering(false)
    }
  }

  function selectAsset(asset: GeneratedAsset) {
    const nextTheme = inputString(asset, "theme")
    const nextGenre = inputString(asset, "genre")
    const nextMood = inputString(asset, "mood")
    const nextAudioUrl = inputString(asset, "audio_url")
    const nextSubmissionId = inputString(asset, "submission_id")
    const nextTargetLufs = inputNumber(asset, "target_lufs")
    if (nextTheme) setTheme(nextTheme)
    if (nextGenre && MUSIC_GENRES.some((item) => item.code === nextGenre)) setGenre(nextGenre)
    if (nextMood) setMood(nextMood)
    if (nextTargetLufs !== null) setTargetLufs(nextTargetLufs)

    if (asset.asset_type === "lyrics") {
      setLyrics(asset)
      toast.success("가사 기록을 불러왔습니다")
    } else if (asset.asset_type === "composition") {
      setComposition(asset)
      toast.success("데모 기록을 불러왔습니다")
    } else {
      setMastering(asset)
      setSelectedSubmissionId(nextSubmissionId ?? asset.source_submission_id ?? "")
      setMasterSourceUrl(nextSubmissionId || asset.source_submission_id ? "" : nextAudioUrl ?? "")
      toast.success("마스터링 기록을 불러왔습니다")
    }
  }

  async function copyOutput(asset: GeneratedAsset) {
    if (!asset.output_text) return
    try {
      await navigator.clipboard.writeText(asset.output_text)
      toast.success("생성 결과를 복사했습니다")
    } catch {
      toast.error("복사에 실패했습니다")
    }
  }

  return (
    <div className="mx-auto max-w-[1180px] space-y-8">
      <section className="app-card-lift grid overflow-hidden lg:grid-cols-[0.92fr_1.08fr]">
        <div className="p-7 md:p-8">
          <span className="vo-tag vo-tag-amber">AI Studio</span>
          <h1 className="h-display mt-6">
            아이디어를 <em>첫 번째 데모</em>로 바꾸는 작곡실
          </h1>
          <p className="mt-4 max-w-[560px] text-sm leading-6 text-[var(--ink-2)]">
            장르, 무드, 주제를 입력해 한국어 가사와 데모 트랙 초안을 생성합니다.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={handleLyrics} disabled={loadingLyrics} className="vo-btn vo-btn-primary">
              {loadingLyrics ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              가사 생성
            </button>
            <button onClick={handleCompose} disabled={loadingComposition} className="vo-btn vo-btn-ghost">
              {loadingComposition ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
              데모 작곡
            </button>
            <button onClick={handleMastering} disabled={loadingMastering} className="vo-btn vo-btn-ghost">
              {loadingMastering ? <Loader2 className="size-4 animate-spin" /> : <SlidersHorizontal className="size-4" />}
              마스터링
            </button>
          </div>
        </div>
        <div className="border-t border-[var(--line)] bg-[var(--tint)] p-6 lg:border-l lg:border-t-0">
          <div className="flex h-full min-h-[280px] flex-col justify-between rounded-[18px] border border-[var(--line)] bg-[var(--card)] p-5">
            <div>
              <div className="label-mono">Generated Lyrics</div>
              <pre className="mt-4 max-h-[250px] whitespace-pre-wrap text-sm leading-7 text-[var(--ink-1)]">
                {lyrics?.output_text ?? "가사를 생성하면 이곳에 결과가 표시됩니다."}
              </pre>
            </div>
            {lyrics && (
              <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4 text-xs text-[var(--ink-3)]">
                <span>{lyrics.provider}</span>
                <span>{lyrics.model}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="app-card p-6">
          <div className="label-mono">Prompt Composer</div>
          <div className="mt-5 grid gap-3">
            {[
              ["Theme", theme, setTheme],
              ["Mood", mood, setMood],
            ].map(([label, value, setter]) => (
              <label key={label as string} className="rounded-[12px] border border-[var(--line)] bg-[var(--card)] p-4">
                <span className="label-mono">{label as string}</span>
                <textarea
                  value={value as string}
                  onChange={(event) => (setter as (next: string) => void)(event.target.value)}
                  rows={label === "Theme" ? 3 : 1}
                  className="mt-2 w-full resize-none bg-transparent text-sm text-[var(--ink-0)] outline-none"
                />
              </label>
            ))}
            <label className="rounded-[12px] border border-[var(--line)] bg-[var(--card)] p-4">
              <span className="label-mono">Genre</span>
              <select
                value={genre}
                onChange={(event) => setGenre(event.target.value)}
                className="mt-2 w-full bg-transparent text-sm text-[var(--ink-0)] outline-none"
              >
                {MUSIC_GENRES.map((item) => (
                  <option key={item.code} value={item.code}>{item.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="app-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="label-mono">Preset Bank</div>
              <h2 className="h-2 mt-2">추천 사운드</h2>
            </div>
            <div className="flex size-9 items-center justify-center rounded-full border border-[var(--line)]">
              <Music2 className="size-4" />
            </div>
          </div>
          <div className="space-y-3">
            {presets.map((preset) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => {
                  setGenre(preset.genre)
                  setMood(preset.tone)
                }}
                className="flex w-full items-center gap-3 rounded-[12px] border border-[var(--line)] p-3 text-left transition-colors hover:border-[var(--amber-l)]"
              >
                <div className="flex size-10 items-center justify-center rounded-[10px] bg-[var(--tint)] text-[var(--ink-2)]">
                  <Disc3 className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[var(--ink-0)]">{preset.title}</div>
                  <div className="text-xs text-[var(--ink-3)]">{preset.tone}</div>
                </div>
                <div className="font-mono text-xs text-[var(--ink-3)]">{preset.level}</div>
              </button>
            ))}
          </div>
          {composition && (
            <div className="mt-5 rounded-[12px] border border-[var(--line)] bg-[var(--tint)] p-4 text-sm text-[var(--ink-2)]">
              <div className="flex items-center justify-between gap-3">
                <span>
                  {composition.status === "succeeded"
                    ? composition.output_url ? "데모 음원이 생성되었습니다." : "데모 구성안이 생성되었습니다."
                    : composition.error_message ?? "작곡 provider 설정이 필요합니다."}
                </span>
                {composition.output_text && (
                  <button
                    type="button"
                    onClick={() => copyOutput(composition)}
                    className="flex h-7 shrink-0 items-center gap-1.5 rounded border border-[var(--line)] px-2 text-[11px] text-[var(--ink-2)] hover:border-[var(--ink-2)]"
                  >
                    <Copy className="size-3" />
                    복사
                  </button>
                )}
              </div>
              {composition.output_text && (
                <pre className="mt-4 max-h-[300px] overflow-auto whitespace-pre-wrap rounded-[10px] border border-[var(--line)] bg-[var(--card)] p-4 text-xs leading-6 text-[var(--ink-1)]">
                  {composition.output_text}
                </pre>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="app-card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="label-mono">Mastering Desk</div>
            <h2 className="h-2 mt-2">오디오 마스터링</h2>
          </div>
          <button
            onClick={handleMastering}
            disabled={loadingMastering || !sourceAudioUrl}
            className="vo-btn vo-btn-primary"
          >
            {loadingMastering ? <Loader2 className="size-4 animate-spin" /> : <SlidersHorizontal className="size-4" />}
            마스터 적용
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-4">
            <label className="block rounded-[12px] border border-[var(--line)] bg-[var(--card)] p-4">
              <span className="label-mono">Source Track</span>
              <select
                value={selectedSubmissionId}
                onChange={(event) => {
                  setSelectedSubmissionId(event.target.value)
                  if (event.target.value) setMasterSourceUrl("")
                }}
                className="mt-3 h-10 w-full rounded border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink-0)] outline-none"
              >
                <option value="">직접 URL 또는 데모 결과</option>
                {masterableSubmissions.map((submission) => (
                  <option key={submission.id} value={submission.id}>
                    {submission.title} · {submission.genre_label ?? musicGenreLabel(submission.genre)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block rounded-[12px] border border-[var(--line)] bg-[var(--card)] p-4">
              <span className="label-mono">Audio URL</span>
              <div className="mt-3 flex items-center gap-2 rounded border border-[var(--line)] bg-[var(--paper)] px-3">
                <Link2 className="size-4 shrink-0 text-[var(--ink-3)]" />
                <input
                  value={masterSourceUrl}
                  onChange={(event) => {
                    setSelectedSubmissionId("")
                    setMasterSourceUrl(event.target.value)
                  }}
                  placeholder={composition?.output_url ?? "https://..."}
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm text-[var(--ink-0)] outline-none"
                />
              </div>
            </label>

            <label className="block rounded-[12px] border border-[var(--line)] bg-[var(--card)] p-4">
              <span className="label-mono">Target LUFS</span>
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="range"
                  min={-18}
                  max={-10}
                  step={0.5}
                  value={targetLufs}
                  onChange={(event) => setTargetLufs(Number(event.target.value))}
                  className="min-w-0 flex-1 accent-[var(--amber)]"
                />
                <input
                  type="number"
                  min={-18}
                  max={-10}
                  step={0.5}
                  value={targetLufs}
                  onChange={(event) => setTargetLufs(Number(event.target.value))}
                  className="h-9 w-20 rounded border border-[var(--line)] bg-[var(--paper)] px-2 text-right font-mono text-sm text-[var(--ink-0)] outline-none"
                />
              </div>
            </label>
          </div>

          <div className="flex min-h-[320px] flex-col justify-between rounded-[12px] border border-[var(--line)] bg-[var(--tint)] p-5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="label-mono">Mastered Output</div>
                  <div className="mt-2 text-sm font-medium text-[var(--ink-0)]">
                    {mastering ? statusLabel(mastering.status) : "Ready"}
                  </div>
                </div>
                <div className="flex size-10 items-center justify-center rounded-[10px] border border-[var(--line)] bg-[var(--card)] text-[var(--amber)]">
                  <Volume2 className="size-4" />
                </div>
              </div>

              <div className="mt-5 rounded-[10px] border border-[var(--line)] bg-[var(--card)] p-4 text-sm text-[var(--ink-2)]">
                {mastering?.status === "succeeded"
                  ? "마스터링된 오디오가 준비되었습니다."
                  : mastering?.error_message ?? "소스 오디오와 목표 LUFS를 선택하면 결과가 이곳에 표시됩니다."}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {mastering?.output_url && (
                <audio controls src={mastering.output_url} className="w-full" />
              )}
              <div className="flex flex-wrap items-center gap-2">
                {sourceAudioUrl && (
                  <a
                    href={sourceAudioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 items-center gap-1.5 rounded border border-[var(--line)] px-3 text-xs text-[var(--ink-2)] hover:border-[var(--ink-2)]"
                  >
                    <ExternalLink className="size-3" />
                    원본 열기
                  </a>
                )}
                {mastering?.output_url && (
                  <a
                    href={mastering.output_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 items-center gap-1.5 rounded border border-[var(--line)] px-3 text-xs text-[var(--ink-2)] hover:border-[var(--ink-2)]"
                  >
                    <ExternalLink className="size-3" />
                    결과 열기
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="app-card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="label-mono">Saved Assets</div>
            <h2 className="h-2 mt-2">생성 히스토리</h2>
          </div>
          <button
            onClick={() => refetchAssets()}
            disabled={fetchingAssets}
            className="flex h-9 items-center gap-2 rounded border border-[var(--line)] px-3 text-xs font-medium text-[var(--ink-1)] transition-colors hover:border-[var(--ink-2)] disabled:opacity-50"
          >
            <RefreshCw className={`size-3 ${fetchingAssets ? "animate-spin" : ""}`} />
            새로고침
          </button>
        </div>

        {loadingAssets ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-[136px] animate-pulse rounded-[12px] border border-[var(--line)] bg-[var(--tint)]" />
            ))}
          </div>
        ) : assetsError ? (
          <div className="rounded-[12px] border border-[var(--line)] bg-[var(--tint)] p-5 text-sm text-[var(--ink-2)]">
            히스토리를 불러오지 못했습니다.
          </div>
        ) : assets.length === 0 ? (
          <div className="rounded-[12px] border border-[var(--line)] bg-[var(--tint)] p-5 text-sm text-[var(--ink-2)]">
            아직 생성 기록이 없습니다.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => {
              const Icon = asset.asset_type === "lyrics" ? FileText : asset.asset_type === "mastering" ? SlidersHorizontal : Music2
              const description = assetDescription(asset)
              return (
                <article key={asset.id} className="overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--card)]">
                  <button
                    type="button"
                    onClick={() => selectAsset(asset)}
                    className="flex min-h-[104px] w-full gap-3 p-4 text-left transition-colors hover:bg-[var(--tint)]"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--tint)] text-[var(--amber)]">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--ink-0)]">{assetTypeLabel(asset.asset_type)}</span>
                        <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] font-medium text-[var(--ink-3)]">
                          {statusLabel(asset.status)}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--ink-2)]">{description}</p>
                      <div className="mt-3 flex items-center gap-1 text-[11px] text-[var(--ink-3)]">
                        <Clock3 className="size-3" />
                        {formatAssetDate(asset.created_at)}
                      </div>
                    </div>
                  </button>
                  {(asset.output_text || asset.output_url) && (
                    <div className="flex items-center gap-2 border-t border-[var(--line)] px-4 py-2">
                      {asset.output_text && (
                        <button
                          type="button"
                          onClick={() => copyOutput(asset)}
                          className="flex h-7 items-center gap-1.5 rounded border border-[var(--line)] px-2 text-[11px] text-[var(--ink-2)] hover:border-[var(--ink-2)]"
                        >
                          <Copy className="size-3" />
                          복사
                        </button>
                      )}
                      {asset.output_url && (
                        <a
                          href={asset.output_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-7 items-center gap-1.5 rounded border border-[var(--line)] px-2 text-[11px] text-[var(--ink-2)] hover:border-[var(--ink-2)]"
                        >
                          <ExternalLink className="size-3" />
                          열기
                        </a>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Lyrics", value: lyrics ? lyrics.provider : "Ready", icon: Sparkles },
          { label: "Composition", value: composition?.status ?? "Provider pending", icon: Music2 },
          { label: "Mastering", value: mastering?.status ?? "ffmpeg loudnorm", icon: SlidersHorizontal },
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
