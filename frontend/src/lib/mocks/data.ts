import type { User, Persona, Submission, WeeklyRanking, CreditTransaction } from "@/types/api"

export const mockUser: User = {
  id: "user-1",
  email: "demo@vertualowl.com",
  nickname: "음악천재",
  role: "creator",
  profile_image_url: null,
  bio: "발라드를 사랑하는 아마추어 보컬리스트",
  credit_balance: 10,
  created_at: "2026-04-01T00:00:00Z",
}

export const mockPersonas: Persona[] = [
  {
    id: "persona-1",
    name: "김범수",
    display_name: "김범수 (발라드 마스터)",
    genre: "발라드",
    image_url: null,
    description: "고음의 안정성과 감성적인 표현이 특징인 발라드의 제왕. 파워풀한 고음과 섬세한 감정 표현을 높이 평가합니다.",
    weights: [
      { dimension: "pitch", multiplier: 1.5 },
      { dimension: "dynamic", multiplier: 1.2 },
    ],
  },
  {
    id: "persona-2",
    name: "아이유",
    display_name: "아이유 (국민 아이돌)",
    genre: "팝/발라드",
    image_url: null,
    description: "깔끔한 발음과 감성적인 표현의 완벽한 조화. 자연스러운 감정 전달과 정확한 발음을 중시합니다.",
    weights: [
      { dimension: "articulation", multiplier: 1.3 },
      { dimension: "dynamic", multiplier: 1.3 },
    ],
  },
  {
    id: "persona-3",
    name: "박효신",
    display_name: "박효신 (소울 보이스)",
    genre: "R&B/발라드",
    image_url: null,
    description: "깊은 호흡과 폭넓은 다이내믹 표현의 달인. 감정의 깊이와 호흡의 안정성을 중요하게 생각합니다.",
    weights: [
      { dimension: "dynamic", multiplier: 1.4 },
      { dimension: "range", multiplier: 1.3 },
    ],
  },
  {
    id: "persona-4",
    name: "화사",
    display_name: "화사 (파워 보컬)",
    genre: "R&B/힙합",
    image_url: null,
    description: "강렬한 톤과 그루브감이 넘치는 무대 장악력. 독특한 음색과 리듬감을 높이 평가합니다.",
    weights: [
      { dimension: "rhythm", multiplier: 1.3 },
      { dimension: "dynamic", multiplier: 1.2 },
    ],
  },
]

export const mockSubmissions: Submission[] = [
  {
    id: "sub-1",
    title: "봄날의 그대에게",
    genre: "발라드",
    audio_url: "",
    duration_sec: 215,
    status: "scored",
    reject_reason: null,
    ranking_mode: "both",
    base_score: {
      pitch: 17.2,
      rhythm: 15.8,
      range: 14.5,
      dynamic: 16.0,
      articulation: 15.5,
      total: 79.0,
    },
    persona_scores: [
      {
        persona_id: "persona-1",
        persona_name: "김범수",
        score: 85.2,
        feedback: {
          summary: "전반적으로 안정적인 보컬 라인을 보여줬습니다. 특히 후렴구에서의 고음 처리가 인상적이었어요. 조금 더 감정을 담아서 부른다면 완성도가 높아질 것 같습니다.",
          strengths: [
            { timestamp: "0:32", description: "후렴 진입부의 피치 안정성이 뛰어납니다" },
            { timestamp: "1:15", description: "다이내믹 변화가 자연스럽게 표현됩니다" },
            { timestamp: "2:05", description: "고음 영역에서의 음색 유지가 좋습니다" },
          ],
          improvements: [
            { timestamp: "0:18", description: "verse 초반 발음이 조금 뭉개집니다. 자음을 더 명확히" },
            { timestamp: "1:45", description: "브릿지 부분에서 호흡이 짧아지고 있어요" },
            { timestamp: "2:30", description: "마지막 롱톤에서 비브라토를 좀 더 안정적으로" },
          ],
        },
      },
    ],
    created_at: "2026-04-28T14:30:00Z",
  },
  {
    id: "sub-2",
    title: "어느 봄날",
    genre: "팝",
    audio_url: "",
    duration_sec: 180,
    status: "scoring",
    reject_reason: null,
    ranking_mode: "ranking",
    base_score: null,
    persona_scores: [],
    created_at: "2026-05-04T10:00:00Z",
  },
]

export const mockWeeklyRanking: WeeklyRanking = {
  period: {
    start_at: "2026-04-28T00:00:00Z",
    end_at: "2026-05-04T23:59:59Z",
    status: "active",
  },
  entries: [
    { rank: 1, user_id: "u1", nickname: "보컬킹", profile_image_url: null, submission_id: "s1", title: "사랑했잖아", score: 94.3, rank_change: 2 },
    { rank: 2, user_id: "u2", nickname: "노래천사", profile_image_url: null, submission_id: "s2", title: "그리움", score: 92.1, rank_change: -1 },
    { rank: 3, user_id: "u3", nickname: "멜로디st", profile_image_url: null, submission_id: "s3", title: "봄비", score: 91.5, rank_change: 0 },
    { rank: 4, user_id: "u4", nickname: "가을목소리", profile_image_url: null, submission_id: "s4", title: "첫눈", score: 89.7, rank_change: 3 },
    { rank: 5, user_id: "u5", nickname: "별빛보컬", profile_image_url: null, submission_id: "s5", title: "너를 만난 날", score: 88.2, rank_change: -2 },
    { rank: 6, user_id: "u6", nickname: "음악사랑", profile_image_url: null, submission_id: "s6", title: "잊을게", score: 87.5, rank_change: 1 },
    { rank: 7, user_id: "u7", nickname: "고음장인", profile_image_url: null, submission_id: "s7", title: "이별 연습", score: 86.9, rank_change: 0 },
    { rank: 8, user_id: "user-1", nickname: "음악천재", profile_image_url: null, submission_id: "sub-1", title: "봄날의 그대에게", score: 85.2, rank_change: 4 },
    { rank: 9, user_id: "u9", nickname: "소울가수", profile_image_url: null, submission_id: "s9", title: "밤편지", score: 84.1, rank_change: -1 },
    { rank: 10, user_id: "u10", nickname: "달빛목소리", profile_image_url: null, submission_id: "s10", title: "그대라는 시", score: 83.7, rank_change: 2 },
  ],
  my_entry: { rank: 8, user_id: "user-1", nickname: "음악천재", profile_image_url: null, submission_id: "sub-1", title: "봄날의 그대에게", score: 85.2, rank_change: 4 },
}

export const mockCreditTransactions: CreditTransaction[] = [
  { delta: 10, balance_after: 10, reason: "signup_bonus", created_at: "2026-04-01T00:00:00Z" },
  { delta: -1, balance_after: 9, reason: "submission", created_at: "2026-04-28T14:30:00Z" },
  { delta: 5, balance_after: 14, reason: "reward", created_at: "2026-04-29T10:00:00Z" },
  { delta: -1, balance_after: 13, reason: "submission", created_at: "2026-05-04T10:00:00Z" },
]
