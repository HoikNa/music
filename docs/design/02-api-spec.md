# 02. API Spec

Base URL: `/api/v1`

- Production frontend는 Vercel same-origin `/api/v1/*` 요청을 Next rewrite로 API Gateway에 프록시한다.
- Backend canonical endpoint는 `https://ity0jkac22.execute-api.ap-northeast-2.amazonaws.com/api/v1`.
- 인증: Access Token은 `Authorization: Bearer <token>`, Refresh Token은 `refresh_token` HttpOnly Cookie.
- 현재 페이징 구현은 일부 API에서 `skip`/`limit`, AI assets는 `offset`/`limit`를 사용한다.

---

## 공통 응답/에러

FastAPI 기본 validation은 422 응답을 그대로 반환한다.

```json
{
  "detail": [
    { "loc": ["body", "email"], "msg": "...", "type": "..." }
  ]
}
```

도메인 오류는 `HTTPException.detail`에 문자열 또는 객체를 반환한다. 예: AI 가사 안전 필터 실패.

```json
{
  "detail": {
    "code": "UNSAFE_LYRICS_PROMPT",
    "message": "Lyrics prompt violates safety rules",
    "matched_term": "..."
  }
}
```

---

## Auth

### POST /auth/register
이메일 회원가입. 성공 시 Access Token을 JSON으로 반환하고 Refresh Token을 HttpOnly Cookie로 설정한다.

**Body**
```json
{ "email": "user@example.com", "password": "password123", "nickname": "creator" }
```

**Response 201**
```json
{ "access_token": "...", "token_type": "bearer" }
```

### POST /auth/login
로그인. 응답 구조는 회원가입과 동일하다.

### POST /auth/refresh
`refresh_token` Cookie를 사용해 새 access token과 refresh cookie를 발급한다. Body 없음.

### POST /auth/logout
현재 refresh cookie의 JTI를 서버에서 폐기하고 cookie를 삭제한다.

### GET /auth/me
현재 토큰 사용자와 크레딧 잔액을 반환한다. `GET /users/me`와 같은 목적의 호환 엔드포인트다.

---

## Users

### GET /users/me 🔒
현재 로그인 사용자 프로필과 크레딧 잔액.

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "nickname": "creator",
  "role": "creator",
  "profile_image_url": null,
  "bio": null,
  "credit_balance": 10,
  "created_at": "2026-05-15T00:00:00"
}
```

현재 users 라우터는 조회만 구현되어 있다.

---

## Personas

### GET /personas
활성 페르소나 목록.

### GET /personas/{persona_id}
페르소나 상세.

대표 장르는 공식 장르 코드(`VOVATAR_POP_BALLARD` 등)를 사용한다.

---

## Submissions

### GET /submissions/genres
공식 장르 taxonomy. 제출, 탐색, 랭킹 필터, AI Studio에서 동일하게 사용한다.

```json
{
  "groups": [
    {
      "code": "VOVATAR",
      "label": "VOVATAR",
      "description": "Vocal-Avatar 장르별",
      "children": [
        { "code": "VOVATAR_POP", "label": "Pop" },
        { "code": "VOVATAR_POP_BALLARD", "label": "Pop / Pop Ballard" }
      ]
    }
  ],
  "items": [
    { "code": "VOVATAR_POP", "label": "Pop" },
    { "code": "VOVATAR_POP_BALLARD", "label": "Pop / Pop Ballard" }
  ]
}
```

### POST /submissions 🔒
음원 제출. S3 업로드 URL 소유권, 일일 제출 제한, 중복 오디오, 페르소나, abuse counter를 검증한 뒤 크레딧을 차감하고 scoring 작업을 큐잉한다.

**Body**
```json
{
  "title": "테스트 곡",
  "genre": "VOVATAR_POP_BALLARD",
  "lyrics": "optional",
  "audio_url": "https://<bucket>.s3.ap-northeast-2.amazonaws.com/audio/<user_id>/<uuid>.wav",
  "duration_sec": 180,
  "ranking_mode": "both",
  "persona_ids": ["uuid"]
}
```

**Response 201**
```json
{
  "id": "uuid",
  "submission_id": "uuid",
  "title": "테스트 곡",
  "genre": "VOVATAR_POP_BALLARD",
  "genre_label": "Pop / Pop Ballard",
  "status": "pending",
  "is_ranking_excluded": false,
  "abuse_risk_score": 0.0,
  "abuse_flags": { "status": "evaluated" },
  "base_score": null,
  "persona_scores": []
}
```

### GET /submissions 🔒
내 제출 목록.

**Query**: `skip`, `limit`

**Response 200**
```json
{ "items": ["Submission"], "has_more": false, "next_cursor": null }
```

### GET /submissions/{submission_id} 🔒
제출 상세 + 채점 결과 + 피드백 음성 상태.

`persona_scores[].feedback`은 아직 피드백이 없으면 `null`일 수 있다.

```json
{
  "id": "uuid",
  "genre": "VOVATAR_POP_BALLARD",
  "genre_label": "Pop / Pop Ballard",
  "status": "scored",
  "base_score": {
    "pitch": 17.2,
    "rhythm": 15.8,
    "range": 14.0,
    "dynamic": 16.5,
    "articulation": 15.0,
    "total": 78.5
  },
  "persona_scores": [
    {
      "persona_id": "uuid",
      "persona_name": "김범수",
      "score": 82.3,
      "feedback": {
        "summary": "...",
        "strengths": [{ "timestamp": "0:32", "description": "..." }],
        "improvements": [{ "timestamp": "1:10", "description": "..." }],
        "audio_url": null,
        "audio_status": "queued",
        "audio_model": null,
        "audio_error": null,
        "audio_generated_at": null
      }
    }
  ]
}
```

### DELETE /submissions/{submission_id} 🔒
소유자 제출 soft delete. 현재 상태 제한은 별도 강제하지 않는다.

---

## Uploads

### POST /uploads/presign 🔒
### POST /uploads/presigned-url 🔒
S3 PUT presigned URL 발급.

**Body**
```json
{ "filename": "song.wav", "content_type": "audio/wav", "size_bytes": 123456 }
```

`file_size_bytes`도 프론트 호환 alias로 허용된다. 최대 크기 50MB. 허용 타입: `audio/mpeg`, `audio/wav`, `audio/mp4`, `audio/x-m4a`, `audio/ogg`, `audio/flac`.

**Response 200**
```json
{ "upload_url": "https://...", "audio_url": "https://...", "key": "audio/<user>/<uuid>.wav" }
```

### POST /uploads/verify 🔒
S3 HEAD로 업로드 파일 존재/크기/타입을 검증한다.

---

## Rankings

### GET /rankings/weekly
현재 활성 주간 랭킹.

**Query**
- `persona_id`: optional UUID
- `genre`: optional 공식 장르 코드 또는 alias

장르 필터는 DB join 단계에서 먼저 적용한 뒤 TOP 100을 반환한다.

```json
{
  "period": { "start_at": "2026-05-11", "end_at": "2026-05-17", "status": "active" },
  "entries": [
    {
      "rank": 1,
      "user_id": "uuid",
      "nickname": "...",
      "profile_image_url": null,
      "submission_id": "uuid",
      "title": "...",
      "genre": "VOVATAR_POP",
      "genre_label": "Pop",
      "score": 91.2,
      "rank_change": 3
    }
  ],
  "my_entry": null
}
```

### GET /rankings/periods
활성 랭킹 기간 목록. `persona_id` 필터 지원.

### GET /rankings/periods/{period_id}/entries
특정 기간 entries. `skip`, `limit` 지원.

---

## Tournament

현재 prefix는 `/tournament` 단수다.

### GET /tournament/challenges
활성 마스터 스코어 챌린지 목록.

### GET /tournament/tickets 🔒
내 토너먼트 티켓 목록.

### POST /tournament/master-scores 🔒 admin
페르소나별 마스터 스코어 생성. 기존 활성 스코어는 비활성화한다.

---

## Credits

### GET /credits/balance 🔒
```json
{ "balance": 10 }
```

### GET /credits/transactions 🔒
**Query**: `skip`, `limit`

```json
{
  "items": [
    { "delta": -1, "balance_after": 9, "reason": "submission", "created_at": "..." }
  ],
  "has_more": false,
  "next_cursor": null
}
```

---

## AI Studio

### GET /ai/assets 🔒
사용자의 AI 생성 에셋 히스토리.

**Query**
- `asset_type`: `lyrics` | `composition` | `mastering` optional
- `limit`: 1~100, default 20
- `offset`: default 0

### POST /ai/lyrics 🔒
한국어 가사 초안 생성. 안전 키워드 사전 필터를 먼저 적용한다.

**Body**
```json
{ "theme": "한강 새벽", "genre": "VOVATAR_POP", "mood": "warm", "keywords": ["새벽"] }
```

OpenAI가 설정되어 있고 품질검사를 통과하면 `provider=openai`, 아니면 fallback 가사를 저장한다.

### POST /ai/compose 🔒
가사/프롬프트를 기반으로 데모 구성안을 생성한다.

**Body**
```json
{ "prompt": "...", "genre": "VOVATAR_POP", "mood": "emotional", "duration_sec": 60 }
```

**Response 201**: `GeneratedAsset` (`asset_type=composition`, `output_text`에 blueprint 저장)

### POST /ai/mastering 🔒
오디오 URL 또는 내 제출 ID를 비동기로 마스터링한다.

**Body**
```json
{ "audio_url": "https://...", "submission_id": null, "target_lufs": -14 }
```

**Response 202**: `GeneratedAsset` (`asset_type=mastering`, 최초 `status=queued`)

---

## 배포 메모

- Public frontend: `https://frontend-eta-eosin.vercel.app`
- Vercel production은 `/api/v1/*` rewrite로 API Gateway를 호출하므로 브라우저 CORS 문제를 줄인다.
- 직접 API Gateway를 호출하는 클라이언트는 `CORS_ORIGINS`에 origin 등록이 필요하다.
