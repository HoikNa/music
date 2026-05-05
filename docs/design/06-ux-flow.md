# 06. UX Flow

---

## 전체 페이지 이동 경로

```
/ → /dashboard (루트 리디렉션)

/login
  ├── 성공 → /dashboard
  └── 소셜 OAuth → /api/auth/callback/{provider} → /dashboard
/register
  └── 성공 → /dashboard

/(dashboard)  ← AuthGate 보호 (미로그인 → /login)
├── /dashboard          홈 (프로젝트 현황, 통계, 최근 활동)
├── /ai-studio          AI 작곡 인터페이스
├── /creator-studio     DAW 협업 스튜디오
├── /contest            경연 현황 + 리더보드
├── /distribution       수익/스트리밍 대시보드
├── /explore            디스커버리 피드
├── /submit             음원 제출
│   └── 제출 완료 → /submissions/{id}
├── /submissions        내 제출 목록
│   └── /submissions/{id}   채점 결과 상세
├── /rankings           랭킹 스코어보드
├── /personas           페르소나 소개
└── /credits            크레딧 잔액 + 충전
```

---

## 플로우 1: 회원가입

```
/login → 회원가입 → /register
  ↓
[이메일 / 닉네임 / 비밀번호 입력]
  ↓ 유효성 검사 실패 → 인라인 에러 (shadcn FormMessage)
  ↓ 성공
    → POST /auth/register
    → access_token → sessionStorage
    → refresh_token → HttpOnly Cookie
    → /dashboard (토스트: "환영합니다!")
```

**에러**: 닉네임 중복 → "이미 사용 중인 닉네임입니다" (409)
**소셜**: 카카오/구글 버튼 → OAuth → callback → 동일 결과

---

## 플로우 2: 음원 제출 (핵심)

```
/dashboard → /submit

Step 1: 파일 업로드
  [파일 드래그&드롭 또는 선택]
  → POST /uploads/presign → S3 직접 업로드
  → 업로드 완료 시 미리듣기 활성화
  에러: 파일 크기 초과 → "파일이 너무 큽니다 (최대 200MB)"

Step 2: 곡 정보 입력
  [제목 / 장르 / 가사(선택)]
  → 필수 미입력 시 인라인 에러

Step 3: 페르소나 선택
  [PersonaCard × N] 1~3개 선택
  → 미선택 시 "최소 1명 이상 선택해주세요"

Step 4: 확인 & 제출
  [정보 요약] + 크레딧 차감 안내
  → POST /submissions → 202
  → /submissions/{id} 리디렉션
```

---

## 플로우 3: 채점 결과 확인

```
/submissions/{id} (폴링)
  → GET /submissions/{id} 3초 interval
  → StatusStep: 대기중 → 검증중 → 채점중 → 완료
  → scored 도달 시 폴링 중단, 결과 렌더

화면 구성:
  ├── 오디오 플레이어
  ├── 기본기 점수 (ScoreBar × 5)
  └── 페르소나별 탭
       └── 페르소나 점수 + 피드백
            ├── 총평
            ├── 강점 3개 (타임스탬프 → 해당 시점 재생)
            └── 개선점 3개

하단 CTA:
  ├── "다시 도전하기" → /submit
  └── "랭킹 확인" → /rankings
```

**에러**: 채점 실패 → "채점 중 오류가 발생했습니다."
**표절**: 반려 → "유사한 음원이 감지되었습니다."

---

## 플로우 4: 랭킹 스코어보드

```
/rankings

화면 구성:
  ├── ScoreboardTimer (주간 마감 카운트다운)
  ├── 탭: [종합] [김범수] [아이유] [박효신] [화사]
  ├── 장르 필터
  ├── TOP 3: 강조 표시
  ├── 4위~100위: RankingRow 리스트
  └── "내 순위" 고정 배너 (하단 sticky, 로그인 시)

실시간: useWebSocket /ws/rankings → ranking.store 갱신
```

**에러**: WebSocket 실패 → 폴링 폴백 (30초)
**빈 상태**: "아직 참가자가 없습니다."

---

## 플로우 5: 로그아웃

```
Header 아바타 → DropdownMenu → "로그아웃"
  → POST /auth/logout
  → sessionStorage 클리어
  → /login 리디렉션
```

---

## 권한별 접근 제어

| 경로 | 미로그인 | 로그인(creator) | admin |
|---|---|---|---|
| `/login`, `/register` | ✅ | → /dashboard | → /dashboard |
| `/(dashboard)/**` | → /login | ✅ | ✅ |
| `/admin/**` | → /login | → 403 | ✅ |

보호 주체: `AuthGate` 컴포넌트 (일반 페이지), `proxy.ts` 미들웨어 (`/admin`)

---

## 각 화면 상태 정의

| 화면 | 로딩 | 에러 | 빈 상태 |
|---|---|---|---|
| /dashboard | Skeleton | "데이터를 불러올 수 없습니다" | "첫 음원을 제출해보세요" + CTA |
| /submissions | 리스트 Skeleton | "목록을 불러올 수 없습니다" | "아직 제출한 음원이 없습니다" + CTA |
| /submissions/{id} | 전체 Skeleton | "채점 결과를 불러올 수 없습니다" | — |
| /rankings | 리스트 Skeleton | "랭킹을 불러올 수 없습니다" | "참가자가 없습니다" |
| /personas | 카드 Skeleton | "페르소나 정보를 불러올 수 없습니다" | — |
| /credits | 잔액 Skeleton | "잔액을 불러올 수 없습니다" | — |
| /ai-studio | Skeleton | "불러올 수 없습니다" | — |
| /contest | Skeleton | "불러올 수 없습니다" | — |
| /distribution | Skeleton | "불러올 수 없습니다" | — |
| /explore | Skeleton | "불러올 수 없습니다" | "콘텐츠가 없습니다" |

---

## 토스트 알림 발생 시점

| 이벤트 | 타입 | 메시지 |
|---|---|---|
| 회원가입 성공 | success | "환영합니다!" |
| 로그인 성공 | success | "로그인되었습니다" |
| 제출 완료 (채점 시작) | info | "채점이 시작되었습니다. 잠시 기다려주세요" |
| 채점 완료 | success | "채점이 완료되었습니다!" |
| 제출 반려 | error | "제출이 반려되었습니다: {reason}" |
| 크레딧 부족 | warning | "크레딧이 부족합니다. 충전 후 이용해주세요" |
| 네트워크 오류 | error | "네트워크 오류가 발생했습니다. 다시 시도해주세요" |
