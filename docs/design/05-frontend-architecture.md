# 05. Frontend Architecture

Next.js 15 App Router + React 19. 서버 컴포넌트 우선.

---

## 디렉토리 구조

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (landing)/
│   │   └── page.tsx              # 메인 랜딩
│   ├── (dashboard)/
│   │   ├── layout.tsx            # 사이드바 + 헤더
│   │   ├── dashboard/
│   │   │   └── page.tsx          # 내 대시보드 (최근 제출, 점수 요약)
│   │   ├── submit/
│   │   │   └── page.tsx          # 음원 제출
│   │   ├── submissions/
│   │   │   ├── page.tsx          # 내 제출 목록
│   │   │   └── [id]/
│   │   │       └── page.tsx      # 제출 상세 + 채점 결과
│   │   ├── rankings/
│   │   │   └── page.tsx          # 랭킹 스코어보드
│   │   ├── personas/
│   │   │   └── page.tsx          # 페르소나 소개
│   │   └── credits/
│   │       └── page.tsx          # 크레딧 잔액 + 충전
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # 어드민 대시보드
│   │   └── submissions/
│   │       └── page.tsx          # 검수 목록
│   ├── api/                      # Route Handlers (BFF)
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts      # OAuth 콜백 처리
│   ├── layout.tsx                # Root layout (Provider 주입)
│   └── globals.css               # CSS 변수 + Tailwind
├── components/
│   ├── ui/                       # shadcn/ui 자동 생성 (수동 편집 금지)
│   ├── common/
│   │   ├── ScoreBar.tsx
│   │   ├── AudioPlayer.tsx
│   │   └── StatusStep.tsx
│   ├── persona/
│   │   └── PersonaCard.tsx
│   ├── ranking/
│   │   ├── RankingRow.tsx
│   │   ├── RankBadge.tsx
│   │   └── ScoreboardTimer.tsx
│   ├── submission/
│   │   ├── SubmissionForm.tsx    # 제출 폼 (Client)
│   │   ├── FeedbackCard.tsx
│   │   └── ScoringProgress.tsx  # 채점 진행 상태
│   └── layout/
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── MobileNav.tsx
├── lib/
│   ├── api.ts                    # API 클라이언트 (fetch wrapper)
│   ├── auth.ts                   # JWT 처리 유틸
│   └── utils.ts                  # cn(), formatScore() 등
├── stores/
│   ├── auth.store.ts             # 인증 상태
│   └── ranking.store.ts          # 실시간 랭킹 상태
├── hooks/
│   ├── useAuth.ts
│   ├── useSubmission.ts
│   ├── useRanking.ts
│   └── useWebSocket.ts
├── types/
│   └── api.ts                    # API 응답 타입 정의
├── mocks/
│   ├── handlers.ts               # MSW 핸들러
│   └── data/                     # Mock 데이터 JSON
└── public/
```

---

## 서버 컴포넌트 vs 클라이언트 컴포넌트

**기준**: 상태/이벤트/브라우저 API가 필요하면 Client, 그 외 Server.

| 컴포넌트 | 타입 | 이유 |
|---|---|---|
| 페이지 (rankings, personas) | Server | 초기 데이터 SSR, SEO |
| 대시보드 레이아웃 | Server | 정적 구조 |
| `Sidebar`, `Header` | Client | 활성 메뉴 상태, 모바일 토글 |
| `SubmissionForm` | Client | 파일 업로드, 폼 상태 |
| `ScoringProgress` | Client | 폴링 (3초 interval) |
| `RankingRow` | Server | 정적 렌더 (데이터만 표시) |
| `ScoreboardTimer` | Client | 카운트다운 interval |
| `AudioPlayer` | Client | HTML5 Audio API |
| `FeedbackCard` | Server | 정적 콘텐츠 |
| `useWebSocket` (랭킹 실시간) | Client | WebSocket |

파일 상단에 `"use client"` 명시 필요한 경우만 추가.

---

## Zustand 스토어

### `auth.store.ts`
```
state:
  user: User | null
  accessToken: string | null
  isLoading: boolean

actions:
  setUser(user)
  setAccessToken(token)
  logout()
```
- `accessToken`은 메모리에만 저장 (localStorage 금지)
- `refreshToken`은 HttpOnly Cookie로 관리

### `ranking.store.ts`
```
state:
  entries: RankingEntry[]
  myEntry: RankingEntry | null
  lastUpdated: Date | null

actions:
  updateEntry(entry)   # WebSocket push 수신 시
  setMyEntry(entry)
```

---

## TanStack Query 쿼리 키 전략

```typescript
// 쿼리 키 팩토리 (lib/queryKeys.ts)
export const queryKeys = {
  personas: {
    all: ['personas'] as const,
    detail: (id: string) => ['personas', id] as const,
  },
  submissions: {
    mine: (cursor?: string) => ['submissions', 'mine', cursor] as const,
    detail: (id: string) => ['submissions', id] as const,
  },
  rankings: {
    weekly: (personaId?: string, genre?: string) =>
      ['rankings', 'weekly', { personaId, genre }] as const,
    monthly: () => ['rankings', 'monthly'] as const,
    aroundMe: () => ['rankings', 'aroundMe'] as const,
  },
  credits: {
    balance: () => ['credits', 'balance'] as const,
    transactions: (cursor?: string) => ['credits', 'transactions', cursor] as const,
  },
}
```

채점 결과 폴링:
```typescript
// submissions/[id]/page.tsx
useQuery({
  queryKey: queryKeys.submissions.detail(id),
  refetchInterval: (data) =>
    data?.status === 'scored' ? false : 3000,
})
```

---

## API 클라이언트 (`lib/api.ts`)

fetch wrapper. 토큰 자동 첨부 + 401 시 자동 갱신.

```
기능:
- baseURL: process.env.NEXT_PUBLIC_API_URL
- Authorization: Bearer {accessToken} 자동 첨부
- 401 수신 시: refresh 시도 → 성공 시 재요청 → 실패 시 로그아웃
- 응답 타입 제네릭 지원
```

---

## Mock 전략

백엔드 완성 전 사용. MSW(Mock Service Worker) 기반.

```
mocks/
├── handlers.ts        # MSW 핸들러 (엔드포인트별 mock 응답 정의)
└── data/
    ├── personas.json
    ├── rankings.json
    └── submissions.json
```

개발 시 `NEXT_PUBLIC_USE_MOCK=true` 환경변수로 토글.
`app/layout.tsx`에서 조건부 MSW 초기화.

---

## 환경변수 (`.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
NEXT_PUBLIC_USE_MOCK=true

NEXTAUTH_SECRET=...         # (소셜 로그인 사용 시)
KAKAO_CLIENT_ID=...
GOOGLE_CLIENT_ID=...
```

---

## 라우트 보호

`middleware.ts` (프로젝트 루트):

```
보호 경로: /dashboard/**, /submit, /submissions/**, /credits/**
미로그인 → /login?redirect={현재경로}

어드민 경로: /admin/**
role != admin → 403 페이지
```

---

## 에러 / 로딩 / 빈 상태 처리

각 주요 페이지에 3가지 상태 처리 필수:

| 상태 | 처리 방법 |
|---|---|
| 로딩 | `<Skeleton>` 컴포넌트 (shadcn/ui) |
| 에러 | `error.tsx` (Next.js) + 재시도 버튼 |
| 빈 상태 | Empty State 컴포넌트 (아이콘 + 안내 메시지 + CTA) |

TanStack Query `isLoading`, `isError`, `data` 상태로 분기.
