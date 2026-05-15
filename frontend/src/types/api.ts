export type UserRole = "creator" | "fan" | "admin"
export type AuthProvider = "email" | "kakao" | "google"
export type SubmissionStatus = "pending" | "validating" | "scoring" | "scored" | "rejected"
export type RankingMode = "ranking" | "challenge" | "both"
export type PeriodType = "weekly" | "monthly" | "yearly"
export type CreditReason = "signup_bonus" | "purchase" | "submission" | "reward" | "bonus" | "refund" | "admin"

export interface User {
  id: string
  email: string
  nickname: string
  role: UserRole
  profile_image_url: string | null
  bio: string | null
  credit_balance: number
  created_at: string
}

export interface Persona {
  id: string
  name: string
  display_name: string
  genre: string
  image_url: string | null
  description: string | null
  weights: PersonaWeight[]
}

export interface PersonaWeight {
  dimension: "pitch" | "rhythm" | "range" | "dynamic" | "articulation"
  multiplier: number
}

export interface BaseScore {
  pitch: number
  rhythm: number
  range: number
  dynamic: number
  articulation: number
  total: number
}

export interface Feedback {
  summary: string
  strengths: { timestamp: string; description: string }[]
  improvements: { timestamp: string; description: string }[]
  audio_url: string | null
  audio_status: "queued" | "running" | "succeeded" | "failed" | "skipped"
  audio_model: string | null
  audio_error: string | null
  audio_generated_at: string | null
}

export interface PersonaScore {
  persona_id: string
  persona_name: string
  score: number
  feedback: Feedback | null
}

export interface Submission {
  id: string
  title: string
  genre: string
  genre_label?: string
  audio_url: string
  duration_sec: number
  status: SubmissionStatus
  reject_reason: string | null
  ranking_mode: RankingMode
  is_ranking_excluded?: boolean
  abuse_risk_score?: number
  abuse_flags?: Record<string, unknown> | null
  base_score: BaseScore | null
  persona_scores: PersonaScore[]
  created_at: string
}

export interface RankingEntry {
  rank: number
  user_id: string
  nickname: string
  profile_image_url: string | null
  submission_id: string
  title: string
  score: number
  rank_change: number
  // chart display extensions
  cover_image_url?: string | null
  genre?: string
  genre_label?: string | null
  like_count?: number
}

export interface MusicGenre {
  code: string
  label: string
}

export interface MusicGenreGroup {
  code: string
  label: string
  description: string
  children: MusicGenre[]
}

export interface MusicGenreResponse {
  groups: MusicGenreGroup[]
  items: MusicGenre[]
}

export interface RankingPeriod {
  start_at: string
  end_at: string
  status: "active" | "closed"
}

export interface WeeklyRanking {
  period: RankingPeriod | null
  entries: RankingEntry[]
  my_entry: RankingEntry | null
}

export interface CreditTransaction {
  delta: number
  balance_after: number
  reason: CreditReason
  created_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token?: string  // HttpOnly 쿠키로 전달되므로 응답 바디에 없을 수 있음
  token_type: string
}

export interface GeneratedAsset {
  id: string
  asset_type: "lyrics" | "composition" | "mastering"
  status: "queued" | "running" | "succeeded" | "failed" | "skipped"
  provider: string
  model: string | null
  prompt: string | null
  input_data: Record<string, unknown> | null
  output_text: string | null
  output_url: string | null
  source_submission_id: string | null
  error_message: string | null
  created_at: string
}

export interface GeneratedAssetsResponse {
  items: GeneratedAsset[]
}

export interface ApiError {
  code: string
  message: string
  detail?: Record<string, unknown>
}

export interface PagedResponse<T> {
  items: T[]
  next_cursor: string | null
  has_more: boolean
}
