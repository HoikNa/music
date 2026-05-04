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
}

export interface PersonaScore {
  persona_id: string
  persona_name: string
  score: number
  feedback: Feedback
}

export interface Submission {
  id: string
  title: string
  genre: string
  audio_url: string
  duration_sec: number
  status: SubmissionStatus
  reject_reason: string | null
  ranking_mode: RankingMode
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
