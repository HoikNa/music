# 06. UX Flow

현재 구현 기준의 사용자 플로우. 공개 URL은 `https://frontend-eta-eosin.vercel.app`.

---

## 전체 페이지 이동 경로

```text
/                         공개 홈
/login                    로그인
/register                 회원가입

/(dashboard)              AuthGate 보호. 일부 공개 경로 예외
├── /dashboard            홈 대시보드
├── /ai-studio            가사/데모/마스터링 AI Studio
├── /creator-studio       창작 스튜디오
├── /contest              경연 현황
├── /distribution         수익/유통 대시보드
├── /explore              공개 탐색
├── /submit               음원 제출
├── /submissions          내 제출 목록
├── /submissions/{id}     채점 결과 상세
├── /rankings             공개 주간 차트
├── /personas             페르소나 소개
├── /credits              크레딧
└── /admin                관리자 화면 초안
```

`/rankings`, `/explore`는 미로그인 공개 접근 가능. 그 외 대시보드 경로는 미로그인 시 `/login?redirect=...`로 이동한다.

---

## 플로우 1: 회원가입/로그인

```text
/register
  → 이메일 / 닉네임 / 비밀번호 입력
  → 클라이언트 기본 검증
  → POST /api/v1/auth/register
  → access_token JSON 수신
  → refresh_token HttpOnly Cookie 설정
  → GET /api/v1/users/me
  → Zustand auth store + sessionStorage 저장
  → /dashboard

/login
  → POST /api/v1/auth/login
  → 동일 세션 저장 흐름
  → redirect query가 안전하면 해당 경로, 아니면 /dashboard
```

오류 메시지:

| 상황 | 메시지 |
|---|---|
| 로그인 실패 | 이메일 또는 비밀번호를 확인해주세요 |
| 이메일 중복 | 이미 가입된 이메일입니다. 로그인해주세요 |
| 닉네임 중복 | 이미 사용 중인 닉네임입니다 |
| 422 validation | 입력한 회원가입 정보를 다시 확인해주세요 |

---

## 플로우 2: 음원 제출

```text
/submit

Step 1 파일 업로드
  → POST /uploads/presign 또는 /uploads/presigned-url
  → S3 PUT 직접 업로드
  → 필요 시 POST /uploads/verify

Step 2 곡 정보
  → 제목
  → 공식 장르 taxonomy 선택
  → 가사 optional
  → 참가 방식 ranking/challenge/both

Step 3 페르소나 선택
  → 1~3명 선택

Step 4 확인/제출
  → POST /submissions
  → 크레딧 차감
  → scoring 큐잉
  → /submissions/{id}로 이동
```

공식 장르 목록은 `GET /submissions/genres`와 `frontend/src/lib/musicGenres.ts`가 같은 체계를 사용한다.

---

## 플로우 3: 채점 결과 확인

```text
/submissions/{id}
  → GET /submissions/{id} 3초 polling
  → pending/validating/scoring/rejected/scored 상태 표시
  → feedback audio_status가 queued/running이면 계속 polling
  → scored + audio 완료/실패/skip이면 안정 상태
```

화면 구성:

- 오디오 파일 정보
- 운영 플래그: 랭킹 제외 여부, abuse risk, counter exceeded scope
- 기본기 점수 5축
- 페르소나별 피드백 카드
- 음성 피드백 상태/재생

---

## 플로우 4: 랭킹

```text
/rankings
  → GET /rankings/weekly
  → 장르 필터 선택 시 GET /rankings/weekly?genre={code}
  → TOP 100 리스트
  → 로그인 사용자는 my_entry 표시
```

장르 필터는 DB 쿼리 단계에서 적용한 뒤 TOP 100을 반환한다. WebSocket 실시간 갱신은 아직 구현되지 않았고, 현재 UI는 TanStack Query 기반 조회/새로고침이다.

---

## 플로우 5: AI Studio

```text
/ai-studio
  → GET /ai/assets 로 히스토리 조회

가사 생성
  → theme / genre / mood / keywords
  → POST /ai/lyrics
  → 결과 output_text 표시 및 history 저장

데모 구성안
  → 가사 또는 prompt 기반
  → POST /ai/compose
  → output_text blueprint 표시

마스터링
  → 내 제출 음원 선택 또는 직접 audio_url 입력
  → target_lufs 설정
  → POST /ai/mastering
  → queued asset 생성
  → GET /ai/assets polling으로 running/succeeded/failed 확인
```

OpenAI 키가 없거나 품질검사를 통과하지 못하면 fallback 결과가 저장되며, fallback reason은 asset `input_data.metadata.fallback_reason`에 남는다.

---

## 플로우 6: 로그아웃

```text
Header → 로그아웃
  → POST /auth/logout
  → access token/sessionStorage clear
  → Zustand user clear
  → /login 또는 공개 홈 이동
```

---

## 권한별 접근 제어

| 경로 | 미로그인 | 로그인 creator | admin |
|---|---|---|---|
| `/` | 가능 | 가능 | 가능 |
| `/login`, `/register` | 가능 | `/dashboard`로 redirect 가능 | `/dashboard`로 redirect 가능 |
| `/rankings`, `/explore` | 가능 | 가능 | 가능 |
| 일반 dashboard 경로 | `/login` | 가능 | 가능 |
| `/admin` | `/login` | 앱 레벨 제한 필요 | 가능 |

---

## 상태/토스트

| 이벤트 | 메시지 |
|---|---|
| 회원가입 성공 | 환영합니다! 크레딧 10개가 지급되었습니다 |
| 로그인 성공 | 로그인되었습니다 |
| 가사 생성 성공 | 가사를 생성했습니다 |
| 데모 생성 성공 | 데모 음원을 생성했습니다 / 데모 구성안을 생성했습니다 |
| 마스터링 접수 | 마스터링 작업을 접수했습니다 |
| 히스토리 로드 | 가사/데모/마스터링 기록을 불러왔습니다 |
| 네트워크/API 실패 | 각 화면별 실패 토스트 |
