# 04. Backend Architecture

FastAPI + SQLModel + Mangum 기반의 AWS Lambda API. 현재 앱은 cold start 비용을 줄이기 위해 FastAPI app과 Mangum handler를 lazy load한다.

---

## 디렉토리 구조

```text
backend/app/
├── main.py                  # Lazy FastAPI app, Mangum handler, Lambda event entry
├── config.py                # pydantic-settings 기반 환경변수
├── database.py              # DB engine/session
├── constants/
│   └── genres.py            # 공식 음악 장르 taxonomy + alias normalize
├── dependencies/
│   ├── auth.py              # JWT 인증/관리자 의존성
│   └── db.py                # DB 세션 의존성
├── helpers/
│   └── db.py                # fetch helper
├── models/                  # SQLModel table 정의
│   ├── generated_asset.py   # AI Studio 생성 이력
│   ├── master_score.py
│   ├── ranking.py
│   ├── refresh_token.py
│   ├── score.py
│   ├── submission.py
│   ├── tournament.py
│   └── ...
├── routers/
│   ├── auth.py
│   ├── ai.py
│   ├── credits.py
│   ├── personas.py
│   ├── rankings.py
│   ├── submissions.py
│   ├── tournament.py
│   ├── uploads.py
│   └── users.py
└── services/
    ├── abuse_service.py
    ├── auth_service.py
    ├── credit_service.py
    ├── feedback_tts_service.py
    ├── lyrics_service.py
    ├── mastering_service.py
    ├── music_generation_service.py
    ├── scoring_service.py
    ├── stale_submission_service.py
    └── validation_service.py
```

---

## 라우터 등록

`main.py`에서 모든 라우터를 `prefix = "/api/v1"` 아래 등록한다.

| Router | Prefix | 현재 책임 |
|---|---|---|
| `auth.py` | `/auth` | register/login/refresh/logout/me |
| `users.py` | `/users` | 내 프로필 조회 |
| `personas.py` | `/personas` | 페르소나 목록/상세 |
| `submissions.py` | `/submissions` | 장르 목록, 제출, 목록, 상세, 삭제 |
| `uploads.py` | `/uploads` | S3 presign, upload verify |
| `rankings.py` | `/rankings` | weekly ranking, periods, period entries |
| `credits.py` | `/credits` | 잔액, 거래 이력 |
| `tournament.py` | `/tournament` | challenge, tickets, admin master-score 생성 |
| `ai.py` | `/ai` | lyrics, compose, mastering, generated assets |

---

## Lazy app / Lambda handler

```python
app = LazyASGIApp()


def handler(event, context):
    if event.get("source") == "vertualowl.scoring": ...
    if event.get("source") == "vertualowl.feedback_tts": ...
    if event.get("source") == "vertualowl.mastering": ...
    return _get_asgi_handler()(event, context)
```

Lambda event source로 scoring, feedback TTS, mastering 작업을 재진입 처리한다. 로컬/비-Lambda 환경에서는 `BackgroundTasks`로 fallback한다.

---

## 서비스 레이어

| 서비스 | 책임 |
|---|---|
| `auth_service` | bcrypt 해시, access/refresh JWT, refresh token DB claim/revoke |
| `credit_service` | 가입 보너스, 제출 차감, 환불/보너스/관리자 사유 이력 |
| `abuse_service` | Redis counter 기반 제출 abuse risk 산출. `REDIS_URL` 없으면 skip |
| `validation_service` | 제출 오디오 검증 오케스트레이션 |
| `acrcloud_service` | ACRCloud 연동 확장 포인트 |
| `moderation_service` | 텍스트/콘텐츠 moderation |
| `scoring_service` | submission 상태 전환, base/persona score, feedback/ranking 생성 |
| `feedback_tts_service` | feedback audio 생성 및 status 갱신 |
| `lyrics_service` | OpenAI 가사 생성 + 품질검사 + fallback |
| `music_generation_service` | OpenAI 데모 blueprint + fallback |
| `mastering_service` | ffmpeg/loudnorm 기반 마스터링 |
| `stale_submission_service` | stale scoring 복구. `RECOVER_STALE_ON_STARTUP`로 제어 |

---

## 채점 파이프라인

```text
POST /submissions
  → audio_url 소유권/S3 검증
  → daily limit / duplicate / persona 검증
  → abuse_service 평가
  → credit 차감 + submission/persona 연결 commit
  → Lambda event 또는 BackgroundTasks로 scoring 실행

run_scoring
  → validating
  → validation/moderation/copyright checks
  → scoring
  → base_scores 생성
  → persona_scores/feedbacks 생성
  → feedback TTS 큐잉
  → ranking_entries 갱신
  → scored 또는 rejected
```

---

## AI Studio 파이프라인

- `POST /ai/lyrics`: 안전 키워드 필터 → OpenAI JSON 응답 파싱 → 품질검사 → `generated_assets` 저장. 실패/미설정 시 rule fallback.
- `POST /ai/compose`: OpenAI composition blueprint 또는 rule fallback을 `output_text`로 저장.
- `POST /ai/mastering`: `queued` asset 생성 → Lambda event `vertualowl.mastering` 또는 BackgroundTasks → `running/succeeded/failed` 갱신.

---

## 환경변수

전체 키 목록은 `backend/.env.example`이 기준이다. 주요 운영 키:

```text
DATABASE_URL
JWT_SECRET
ENVIRONMENT=production
CORS_ORIGINS=https://frontend-eta-eosin.vercel.app
AWS_REGION
S3_BUCKET_NAME
REDIS_URL          # 선택. 없으면 abuse counter skip
OPENAI_API_KEY     # 선택. 없으면 AI Studio fallback
FEEDBACK_MODEL
FEEDBACK_TTS_MODEL
LYRICS_MODEL
COMPOSITION_MODEL
MODERATION_MODEL
MUSIC_GENERATION_PROVIDER
MASTERING_TARGET_LUFS
```

Production에서 `JWT_SECRET`이 dev 기본값이면 앱 시작 시 오류를 발생시킨다.

---

## CORS / Frontend proxy

Backend CORS는 `CORS_ORIGINS` whitelist만 허용한다. Production frontend는 `https://frontend-eta-eosin.vercel.app/api/v1/*` same-origin 요청을 Vercel rewrite로 API Gateway에 프록시하므로 브라우저 CORS 노출을 줄인다. API Gateway를 직접 호출하는 origin은 `CORS_ORIGINS`에 추가해야 한다.

---

## 로컬 개발 / 테스트

```bash
cd backend
./venv/bin/uvicorn app.main:app --reload --port 8000
./venv/bin/pytest
```

Swagger는 `ENVIRONMENT=development`일 때만 `/docs`에 노출된다.
