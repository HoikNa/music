# 05. Frontend Architecture

Next.js 15 App Router + React 19. 클라이언트 컴포넌트 위주 (인터랙티브한 대시보드 앱).

---

## 디렉토리 구조

```
frontend/src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx            # AuthGate + Sidebar + Header
│   │   ├── dashboard/
│   │   │   └── page.tsx          # 홈 대시보드 (프로젝트 현황, 통계)
│   │   ├── ai-studio/
│   │   │   └── page.tsx          # AI 작곡 인터페이스
│   │   ├── creator-studio/
│   │   │   └── page.tsx          # DAW 협업 스튜디오
│   │   ├── contest/
│   │   │   └── page.tsx          # 경연 현황 + 리더보드
│   │   ├── distribution/
│   │   │   └── page.tsx          # 수익/유통 대시보드
│   │   ├── explore/
│   │   │   └── page.tsx          # 디스커버리 피드
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
│   ├── layout.tsx                # Root layout (Providers 주입, Playfair Display 폰트)
│   ├── page.tsx                  # 루트 → /dashboard 리디렉션
│   └── globals.css               # 디자인 토큰 + 컴포넌트 유틸 클래스
├── components/
│   ├── ui/                       # shadcn/ui 자동 생성 (수동 편집 금지)
│   ├── auth/
│   │   ├── AuthGate.tsx          # 인증 필요 페이지 래퍼
│   │   └── Providers.tsx         # TanStack Query + Toast Provider
│   ├── common/
│   │   └── ScoreBar.tsx          # 5축 점수 막대 시각화
│   └── layout/
│       ├── Sidebar.tsx           # 220px 사이드바 (nav + 크레딧 블록 + 유저 정보)
│       └── Header.tsx            # 64px 상단 바
├── stores/
│   ├── auth.store.ts             # 인증 상태 (Zustand)
│   └── ranking.store.ts          # 실시간 랭킹 상태 (Zustand)
├── hooks/                        # TanStack Query 커스텀 훅
├── lib/
│   ├── api.ts                    # axios 인스턴스 + 토큰 자동 갱신 인터셉터
│   └── utils.ts                  # cn() 등 유틸
└── proxy.ts                      # Next.js 미들웨어 (/admin 라우트 edge 보호)
```

---

## 사이드바 네비게이션 구조

```
Workspace 그룹: Dashboard / AI Studio / Creator Studio
Network 그룹:   Contest / Distribution / Explore
Library 그룹:   내 제출 / 랭킹

하단 sticky: 크레딧 블록 + 유저 아바타
```

---

## 클라이언트 컴포넌트 기준

`"use client"` 필요한 경우: 상태/이벤트/브라우저 API 사용 시.

| 컴포넌트 | 타입 | 이유 |
|---|---|---|
| 대시보드 페이지들 | Client | Zustand store 접근, 인터랙션 |
| `Sidebar`, `Header` | Client | pathname, auth store |
| `AuthGate` | Client | 인증 상태 확인 + 리다이렉트 |
| `SubmissionForm` | Client | 파일 업로드, 폼 상태 |
| `ScoreBar` | Client | 애니메이션 |

---

## Zustand 스토어

### `auth.store.ts`
```
state:
  user: User | null       # 닉네임, credit_balance 등 포함
  isLoading: boolean

actions:
  setUser(user)
  logout()
```

- `access_token`: sessionStorage 저장 (탭 닫으면 소멸, hard reload 생존)
- `refresh_token`: HttpOnly 쿠키 (axios 인터셉터가 자동 갱신)

### `ranking.store.ts`
```
state:
  entries: RankingEntry[]
  myEntry: RankingEntry | null
  lastUpdated: Date | null

actions:
  updateEntry(entry)
  setMyEntry(entry)
```

---

## API 클라이언트 (`lib/api.ts`)

axios 인스턴스. 토큰 자동 첨부 + 401 시 자동 갱신.

```
- baseURL: NEXT_PUBLIC_API_URL
- 요청 인터셉터: Authorization: Bearer {sessionStorage.accessToken}
- 응답 인터셉터: 401 → POST /auth/refresh → 성공 시 재요청 → 실패 시 로그아웃
```

---

## 라우트 보호

`proxy.ts` (Next.js 미들웨어): `/admin` 라우트만 edge 보호.
일반 대시보드 보호: `AuthGate` 컴포넌트가 처리 (클라이언트 사이드).

```
/admin/** → 미로그인 또는 role != admin → 403
/(dashboard)/** → AuthGate → 미로그인 시 /login 리디렉션
```

---

## Mock 전략

`NEXT_PUBLIC_USE_MOCK=true` 환경변수로 토글.
실 API 없이 개발 가능. 백엔드 완성 후 false로 전환.

---

## 환경변수 (`.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_USE_MOCK=false
```

---

## 에러 / 로딩 / 빈 상태 처리

| 상태 | 처리 방법 |
|---|---|
| 로딩 | `<Skeleton>` (shadcn/ui) |
| 에러 | `error.tsx` (Next.js) + 재시도 버튼 |
| 빈 상태 | Empty State (아이콘 + 안내 + CTA) |

TanStack Query `isLoading`, `isError`, `data` 상태로 분기.
