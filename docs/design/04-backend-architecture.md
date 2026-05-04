# 04. Backend Architecture

FastAPI + SQLModel + Mangum (AWS Lambda). 도메인별 라우터 분리.

---

## 디렉토리 구조

```
backend/
├── main.py                  # FastAPI app + Mangum handler
├── config.py                # 환경변수 로딩 (pydantic-settings)
├── database.py              # DB 엔진 + 세션 팩토리
├── dependencies.py          # 공통 의존성 (인증, DB 세션)
├── models/                  # SQLModel 테이블 정의
│   ├── base.py              # BaseModel (id, created_at, updated_at)
│   ├── user.py
│   ├── persona.py
│   ├── submission.py
│   ├── score.py
│   ├── ranking.py
│   ├── tournament.py
│   └── credit.py
├── schemas/                 # Pydantic Request/Response 스키마
│   ├── auth.py
│   ├── user.py
│   ├── submission.py
│   ├── ranking.py
│   └── credit.py
├── routers/                 # 엔드포인트 (도메인별)
│   ├── auth.py
│   ├── users.py
│   ├── personas.py
│   ├── submissions.py
│   ├── uploads.py
│   ├── rankings.py
│   ├── tournament.py
│   ├── credits.py
│   └── admin.py
├── services/                # 비즈니스 로직
│   ├── auth_service.py
│   ├── submission_service.py
│   ├── scoring_service.py
│   ├── persona_service.py
│   ├── ranking_service.py
│   └── credit_service.py
├── db/                      # DB 헬퍼
│   └── helpers.py
├── tasks/                   # 비동기 처리 (채점 파이프라인)
│   └── scoring_pipeline.py
├── migrations/              # Alembic
│   ├── env.py
│   └── versions/
└── alembic.ini
```

---

## 라우터 구조

각 라우터는 `APIRouter(prefix="/...", tags=["..."])` 로 정의.
`main.py`에서 `app.include_router()` 로 통합.

| 파일 | Prefix | 설명 |
|---|---|---|
| `auth.py` | `/auth` | 회원가입, 로그인, 토큰 갱신 |
| `users.py` | `/users` | 프로필 조회/수정 |
| `personas.py` | `/personas` | 페르소나 목록/상세 |
| `submissions.py` | `/submissions` | 제출 CRUD + 결과 조회 |
| `uploads.py` | `/uploads` | S3 Presigned URL |
| `rankings.py` | `/rankings` | 주간/월간 랭킹 |
| `tournament.py` | `/tournaments` | 현재 토너먼트 + 진출권 |
| `credits.py` | `/credits` | 잔액 + 거래 이력 |
| `admin.py` | `/admin` | 관리자 전용 |

---

## 서비스 레이어 역할

라우터 ↔ DB 사이 비즈니스 로직 전담. 라우터에서는 서비스만 호출.

| 서비스 | 책임 |
|---|---|
| `auth_service` | 토큰 생성/검증, 비밀번호 해시, OAuth 코드 교환 |
| `submission_service` | 제출 생성, 상태 전환 제어, 크레딧 차감 |
| `scoring_service` | 채점 파이프라인 오케스트레이션 (외부 AI API 호출 → 점수 저장) |
| `persona_service` | 페르소나 가중치 적용 점수 계산 |
| `ranking_service` | Redis Sorted Set 갱신, 주간 마감 트리거 |
| `credit_service` | 잔액 조회, 충전/차감, 트랜잭션 기록 (원자적 처리) |

---

## DB 헬퍼 (`db/helpers.py`)

공통 DB 작업. 직접 SQL 금지, 헬퍼 경유.

| 함수 | 시그니처 | 설명 |
|---|---|---|
| `fetch_by_id` | `(session, Model, id) → Model \| None` | ID로 단건 조회 |
| `fetch_one_by` | `(session, Model, **kwargs) → Model \| None` | 조건 단건 |
| `fetch_list` | `(session, Model, filters, cursor, limit) → (list, next_cursor)` | cursor 페이징 |
| `create` | `(session, model_instance) → Model` | 생성 + commit |
| `update` | `(session, instance, **kwargs) → Model` | 수정 + commit |
| `soft_delete` | `(session, instance) → None` | is_deleted=True + deleted_at |

---

## 의존성 주입 (`dependencies.py`)

```
# DB 세션
def get_session() -> Generator[Session, None, None]

# 인증 (JWT 검증)
def get_current_user(token: str = Depends(oauth2_scheme), session = Depends(get_session)) -> User

# 관리자 권한
def require_admin(current_user: User = Depends(get_current_user)) -> User
```

라우터에서 사용:
```
@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    ...
```

---

## 채점 파이프라인 (`tasks/scoring_pipeline.py`)

비동기 처리. MVP에서는 BackgroundTasks 사용 (Lambda 비동기 호출로 교체 가능).

```
1. submission.status = "validating"
2. 표절/저작권 검증 (Chromaprint 로컬 or 외부 API)
3. 실패 → status = "rejected", reject_reason 저장
4. 성공 → status = "scoring"
5. 5축 기본기 채점 (Whisper + Librosa)
6. 페르소나 가중치 적용
7. LLM 피드백 생성 (Claude API)
8. base_scores, persona_scores, feedbacks 저장
9. ranking_entries 갱신 (Redis Sorted Set + DB)
10. status = "scored"
```

---

## Mangum Lambda 핸들러 (`main.py`)

```python
# main.py 최하단
from mangum import Mangum
handler = Mangum(app, lifespan="off")
```

로컬 개발: `uvicorn main:app --reload`
Lambda: `handler` 함수가 진입점

---

## 환경변수 (`.env.example`)

```
# DB
DATABASE_URL=postgresql://user:pass@host:5432/vertualowl

# JWT
JWT_SECRET_KEY=...
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# AWS
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-northeast-2
S3_BUCKET_NAME=vertualowl-audio

# Redis
REDIS_URL=redis://localhost:6379/0

# OAuth
KAKAO_CLIENT_ID=...
KAKAO_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# AI (MVP: 외부 API)
ANTHROPIC_API_KEY=...

# App
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000,https://vertualowl.vercel.app
```

---

## CORS 설정

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

`allow_origins`는 환경변수로 화이트리스트 관리. 와일드카드 `*` 금지.

---

## 에러 핸들링

전역 예외 핸들러 2개:
1. `RequestValidationError` → 422 + 필드별 메시지
2. `HTTPException` → 그대로 전달
3. `Exception` (catch-all) → 500 + 내부 메시지 숨김 (prod)

비즈니스 에러는 서비스에서 `HTTPException` raise.

---

## 페이징 구현

cursor = `base64(created_at.isoformat() + ":" + str(id))`

```
fetch_list 내부:
  if cursor:
      (ts, id) = decode(cursor)
      WHERE (created_at, id) < (ts, id)
  ORDER BY created_at DESC, id DESC
  LIMIT limit + 1  # +1로 has_more 판별
```
