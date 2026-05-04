# 06. UX Flow

---

## 전체 페이지 이동 경로

```
/ (랜딩)
├── /login
│   ├── 성공 → /dashboard
│   └── 소셜 OAuth → /api/auth/callback/{provider} → /dashboard
├── /register
│   └── 성공 → /dashboard (가입 보너스 크레딧 부여)
│
├── /dashboard              ← 로그인 필수
│   ├── /submit             ← 음원 제출
│   │   └── 제출 완료 → /submissions/{id}
│   ├── /submissions
│   │   └── /submissions/{id}   ← 채점 결과
│   ├── /rankings           ← 랭킹 스코어보드
│   ├── /personas           ← 페르소나 소개
│   └── /credits            ← 크레딧
│
└── /admin                  ← admin 역할 필수
    └── /admin/submissions  ← 검수 대기 목록
```

---

## 플로우 1: 회원가입

```
/ → 회원가입 버튼 → /register
  ↓
[이메일 / 닉네임 / 비밀번호 입력]
  ↓ 유효성 검사 실패
    → 필드 아래 인라인 에러 메시지 (shadcn FormMessage)
  ↓ 성공
    → POST /auth/register
    → access_token 메모리 저장, refresh_token HttpOnly Cookie
    → /dashboard (토스트: "환영합니다! 크레딧 10개가 지급되었습니다")
```

**빈 상태**: 해당 없음
**에러**: 닉네임 중복 → "이미 사용 중인 닉네임입니다" (409)
**소셜**: 카카오/구글 버튼 → OAuth 리디렉션 → callback → 동일 결과

---

## 플로우 2: 음원 제출 (핵심)

```
/dashboard → 제출하기 버튼 → /submit

Step 1: 파일 업로드
  [파일 드래그&드롭 또는 선택]
  → POST /uploads/presign → S3 직접 업로드
  → 업로드 완료 시 오디오 미리듣기 활성화
  상태: 파일 미선택 → "WAV 또는 FLAC 파일을 업로드하세요"
  에러: 파일 크기 초과(200MB) → "파일이 너무 큽니다 (최대 200MB)"

Step 2: 곡 정보 입력
  [제목 / 장르 선택 / 가사 (선택)]
  → 필수 필드 미입력 시 인라인 에러

Step 3: 페르소나 선택
  [PersonaCard × N] 1~3개 체크 가능
  → 미선택 시 "최소 1명 이상 선택해주세요"
  → 참가 모드 선택 (랭킹 / 도전 / 둘 다)

Step 4: 확인 & 제출
  [선택 정보 요약] + 크레딧 차감 안내
  → POST /submissions → 202 수신
  → /submissions/{id} 리디렉션

/submissions/{id}: 채점 진행
  → GET /submissions/{id} 3초 폴링
  → StatusStep: 대기중 → 검증중 → 채점중 → 완료
  → scored 도달 시 폴링 중단, 결과 렌더
```

**로딩**: 각 단계별 Skeleton
**에러**: 표절 감지 → "유사한 음원이 감지되었습니다. 검토 후 다시 제출해주세요"
**빈 상태**: 해당 없음

---

## 플로우 3: 채점 결과 확인

```
/submissions/{id} (status: scored)

화면 구성:
  ├── 오디오 플레이어 (AudioPlayer)
  ├── 기본기 점수 (ScoreBar × 5) + 합산 점수
  └── 페르소나별 탭 (선택한 페르소나 수만큼)
       └── 페르소나 점수 + FeedbackCard
            ├── 총평
            ├── 강점 3개 (타임스탬프 클릭 → 해당 시점 재생)
            └── 개선점 3개

하단 CTA:
  ├── "다시 도전하기" → /submit (동일 곡 정보 pre-fill)
  └── "랭킹 확인" → /rankings
```

**로딩**: 전체 Skeleton (채점 중 상태)
**에러**: 채점 실패 → "채점 중 오류가 발생했습니다. 고객센터에 문의해주세요"

---

## 플로우 4: 랭킹 스코어보드

```
/rankings

화면 구성:
  ├── ScoreboardTimer (주간 마감 카운트다운)
  ├── 탭: [종합] [김범수] [아이유] [박효신] [화사]
  ├── 장르 필터 드롭다운
  ├── TOP 3: 크게 강조 (RankBadge + 이름 + 점수)
  ├── 4위~100위: RankingRow 리스트
  └── "내 순위" 고정 배너 (하단 sticky, 로그인 시)

실시간 갱신:
  → useWebSocket /ws/rankings 연결
  → push 수신 시 ranking.store 갱신 → 화면 자동 반영
```

**로딩**: 랭킹 리스트 Skeleton (10행)
**에러**: WebSocket 연결 실패 → "실시간 업데이트를 사용할 수 없습니다" (폴링 폴백 30초)
**빈 상태**: 제출 0개 → "아직 참가자가 없습니다. 첫 번째 도전자가 되세요!"

---

## 플로우 5: 로그아웃

```
Header 아바타 → DropdownMenu → "로그아웃"
  → POST /auth/logout
  → access_token 메모리 초기화
  → refresh_token Cookie 삭제
  → / (랜딩) 리디렉션
```

---

## 권한별 접근 제어

| 경로 | 미로그인 | 로그인(creator) | admin |
|---|---|---|---|
| `/` | ✅ | ✅ | ✅ |
| `/login`, `/register` | ✅ | → /dashboard | → /dashboard |
| `/dashboard/**` | → /login | ✅ | ✅ |
| `/rankings` | ✅ (읽기) | ✅ | ✅ |
| `/personas` | ✅ (읽기) | ✅ | ✅ |
| `/admin/**` | → /login | → 403 | ✅ |

---

## 각 화면 상태 정의

| 화면 | 로딩 | 에러 | 빈 상태 |
|---|---|---|---|
| /dashboard | 최근 제출 Skeleton | "데이터를 불러올 수 없습니다" | "첫 음원을 제출해보세요" + CTA |
| /submissions | 리스트 Skeleton | "목록을 불러올 수 없습니다" | "아직 제출한 음원이 없습니다" + CTA |
| /submissions/{id} | 전체 Skeleton | "채점 결과를 불러올 수 없습니다" | — (항상 데이터 있음) |
| /rankings | 리스트 Skeleton | "랭킹을 불러올 수 없습니다" | "참가자가 없습니다" |
| /personas | 카드 Skeleton | "페르소나 정보를 불러올 수 없습니다" | — (항상 데이터 있음) |
| /credits | 잔액 Skeleton | "잔액을 불러올 수 없습니다" | — |

---

## 토스트 알림 발생 시점

| 이벤트 | 타입 | 메시지 |
|---|---|---|
| 회원가입 성공 | success | "환영합니다! 크레딧 10개가 지급되었습니다" |
| 로그인 성공 | success | "로그인되었습니다" |
| 제출 완료 (채점 시작) | info | "채점이 시작되었습니다. 잠시 기다려주세요" |
| 채점 완료 | success | "채점이 완료되었습니다!" |
| 제출 반려 | error | "제출이 반려되었습니다: {reason}" |
| 크레딧 부족 | warning | "크레딧이 부족합니다. 충전 후 이용해주세요" |
| 주간 1위 달성 | success | "🎉 이번 주 1위에 올랐습니다!" |
| 네트워크 오류 | error | "네트워크 오류가 발생했습니다. 다시 시도해주세요" |
