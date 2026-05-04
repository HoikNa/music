# 02. API Spec

Base URL: `/api/v1`
인증: Bearer JWT (🔒 표시 엔드포인트)
페이징: cursor 기반 (`cursor`, `limit` 파라미터)
에러 공통 응답:
```
{ "code": "ERR_CODE", "message": "설명", "detail": {} }
```

---

## 에러 코드 정의

| HTTP | Code | 설명 |
|---|---|---|
| 400 | INVALID_INPUT | 요청 파라미터 오류 |
| 401 | UNAUTHORIZED | 인증 토큰 없음 / 만료 |
| 403 | FORBIDDEN | 권한 없음 |
| 404 | NOT_FOUND | 리소스 없음 |
| 409 | CONFLICT | 중복 리소스 (닉네임 등) |
| 422 | VALIDATION_ERROR | 비즈니스 검증 실패 |
| 429 | RATE_LIMITED | 요청 한도 초과 |
| 500 | INTERNAL_ERROR | 서버 오류 |

---

## Auth

### POST /auth/register
회원가입 (이메일).

**Body**
```
email: string
password: string (min 8, 영+숫자+특수문자)
nickname: string (2~20자)
```
**Response 201**
```
{ "access_token": "...", "refresh_token": "...", "token_type": "bearer" }
```

---

### POST /auth/login
로그인.

**Body**
```
email: string
password: string
```
**Response 200** — 동일 토큰 구조

---

### POST /auth/oauth/{provider}
소셜 로그인. `provider`: `kakao`, `google`

**Body**
```
code: string (OAuth authorization code)
```
**Response 200** — 동일 토큰 구조 (신규면 201)

---

### POST /auth/refresh
액세스 토큰 갱신.

**Body**
```
refresh_token: string
```
**Response 200**
```
{ "access_token": "...", "token_type": "bearer" }
```

---

### POST /auth/logout 🔒
리프레시 토큰 무효화.

**Body**
```
refresh_token: string
```
**Response 204**

---

## Users

### GET /users/me 🔒
내 프로필 조회.

**Response 200**
```
{
  "id": "uuid",
  "email": "...",
  "nickname": "...",
  "role": "creator",
  "profile_image_url": "...",
  "bio": "...",
  "credit_balance": 10,
  "created_at": "..."
}
```

---

### PATCH /users/me 🔒
내 프로필 수정.

**Body** (모든 필드 선택)
```
nickname: string
profile_image_url: string
bio: string
```
**Response 200** — 수정된 프로필

---

### GET /users/{user_id}/profile
공개 프로필 + 제출 이력.

**Response 200**
```
{
  "id": "uuid",
  "nickname": "...",
  "profile_image_url": "...",
  "bio": "...",
  "submission_count": 12,
  "best_score": 87.5,
  "recent_submissions": [ ...Submission Summary[] ]
}
```

---

## Personas

### GET /personas
페르소나 목록.

**Query**
```
is_active: bool (default true)
```
**Response 200**
```
{
  "items": [
    {
      "id": "uuid",
      "name": "김범수",
      "display_name": "김범수 (발라드 마스터)",
      "genre": "ballad",
      "image_url": "...",
      "description": "...",
      "weights": [
        { "dimension": "pitch", "multiplier": 1.5 }
      ]
    }
  ]
}
```

---

### GET /personas/{persona_id}
페르소나 상세.

**Response 200** — 위 단일 항목 구조

---

## Submissions

### POST /submissions 🔒
음원 제출.

**Body**
```
title: string (max 200)
genre: string
lyrics: string (nullable)
audio_url: string (S3 presigned 업로드 후 URL 전달)
duration_sec: int
persona_ids: string[] (1~3개)
ranking_mode: "ranking" | "challenge" | "both"
```
**Response 202** — 비동기 처리 시작
```
{
  "submission_id": "uuid",
  "status": "pending",
  "estimated_sec": 30
}
```

---

### GET /submissions/{submission_id} 🔒
제출 상세 + 채점 결과.

**Response 200**
```
{
  "id": "uuid",
  "title": "...",
  "status": "scored",
  "audio_url": "...",
  "base_score": {
    "pitch": 17.2, "rhythm": 15.8, "range": 14.0,
    "dynamic": 16.5, "articulation": 15.0, "total": 78.5
  },
  "persona_scores": [
    {
      "persona_id": "uuid",
      "persona_name": "김범수",
      "score": 82.3,
      "feedback": {
        "summary": "...",
        "strengths": [{ "timestamp": "0:32", "description": "..." }],
        "improvements": [{ "timestamp": "1:10", "description": "..." }]
      }
    }
  ],
  "created_at": "..."
}
```

---

### GET /submissions 🔒
내 제출 목록.

**Query**
```
status: string (선택)
cursor: string
limit: int (default 20, max 50)
```
**Response 200**
```
{
  "items": [ ...Submission Summary[] ],
  "next_cursor": "...",
  "has_more": true
}
```

---

### DELETE /submissions/{submission_id} 🔒
제출 취소 (pending 상태만 가능).

**Response 204**

---

## Uploads

### POST /uploads/presign 🔒
S3 Presigned URL 발급 (클라이언트 직접 업로드용).

**Body**
```
filename: string
content_type: "audio/wav" | "audio/flac"
file_size_bytes: int (max 200MB)
```
**Response 200**
```
{
  "upload_url": "https://s3.amazonaws.com/...",
  "audio_url": "https://s3.amazonaws.com/...(public)",
  "expires_in": 300
}
```

---

## Rankings

### GET /rankings/weekly
현재 주간 랭킹.

**Query**
```
persona_id: uuid (선택, 없으면 종합)
genre: string (선택)
limit: int (default 100)
```
**Response 200**
```
{
  "period": { "start_at": "...", "end_at": "...", "status": "active" },
  "entries": [
    {
      "rank": 1,
      "user_id": "uuid",
      "nickname": "...",
      "profile_image_url": "...",
      "submission_id": "uuid",
      "title": "...",
      "score": 91.2,
      "rank_change": +3
    }
  ],
  "my_entry": { ...위 구조 or null }
}
```

---

### GET /rankings/monthly
월간 랭킹. 동일 구조.

---

### GET /rankings/personas/{persona_id}/weekly
페르소나별 주간 랭킹 TOP 10.

**Response 200** — 동일 구조, limit 10 고정

---

### GET /rankings/weekly/around-me 🔒
내 순위 ±5위 조회.

**Response 200**
```
{
  "my_rank": 42,
  "entries": [ ...10개 내외 ]
}
```

---

## Tournament

### GET /tournaments/current
현재 활성 토너먼트 정보.

**Response 200**
```
{
  "weekly": { "period_id": "uuid", "end_at": "...", "status": "active" },
  "monthly": { "period_id": "uuid", "end_at": "..." },
  "yearly": { "period_id": "uuid", "end_at": "..." }
}
```

---

### GET /tournaments/tickets 🔒
내 진출권 목록.

**Response 200**
```
{
  "items": [
    {
      "id": "uuid",
      "to_period_type": "monthly",
      "persona_name": "김범수",
      "is_used": false,
      "created_at": "..."
    }
  ]
}
```

---

## Credits

### GET /credits/balance 🔒
크레딧 잔액.

**Response 200**
```
{ "balance": 30 }
```

---

### GET /credits/transactions 🔒
크레딧 거래 이력.

**Query**
```
cursor: string
limit: int (default 20)
```
**Response 200**
```
{
  "items": [
    {
      "delta": -1,
      "balance_after": 29,
      "reason": "submission",
      "created_at": "..."
    }
  ],
  "next_cursor": "..."
}
```

---

## Admin

모든 엔드포인트: 🔒 + `role=admin` 필요.

### GET /admin/submissions
전체 제출 목록 + 상태 필터.

**Query**
```
status: string
cursor: string
limit: int (default 50)
```

---

### PATCH /admin/submissions/{submission_id}
제출 상태 수동 변경 (검수).

**Body**
```
status: "scored" | "rejected"
reject_reason: string (rejected 시 필수)
```
**Response 200**

---

### GET /admin/personas
페르소나 목록 (비활성 포함).

### POST /admin/personas
페르소나 생성.

### PATCH /admin/personas/{persona_id}
페르소나 수정 (가중치 포함).

---

## WebSocket

### WS /ws/rankings
실시간 랭킹 갱신 구독.

**Connect Query**
```
persona_id: uuid (선택)
genre: string (선택)
```

**Server Push Message**
```json
{
  "type": "rank_update",
  "data": {
    "rank": 1,
    "user_id": "uuid",
    "nickname": "...",
    "score": 91.2,
    "rank_change": +1
  }
}
```

**Heartbeat**: 30초 간격 `{"type": "ping"}` / 클라이언트 `{"type": "pong"}`

---

## 페이징 정책

- cursor = base64(created_at + id) 조합
- 기본 limit: 20, 최대: 100
- 랭킹은 offset 허용 (순위 기반 직접 접근 필요)

---

## 비동기 처리 흐름 (채점)

```
POST /submissions → 202 (submission_id 반환)
    → 클라이언트가 GET /submissions/{id} 폴링 (3초 간격)
    → status: pending → validating → scoring → scored
    → scored 도달 시 전체 결과 반환
```

향후 WebSocket으로 대체 가능 (`type: "scoring_complete"`).
