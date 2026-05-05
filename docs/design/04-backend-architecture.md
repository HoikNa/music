# 04. Backend Architecture

FastAPI + SQLModel + Mangum (AWS Lambda). 도메인별 라우터 분리.

---

## 디렉토리 구조

```
backend/app/
├── main.py                  # FastAPI app + Mangum handler + lifespan
├── config.py                # 환경변수 로딩 (pydantic-settings)
├── database.py              # DB 엔진 + 세션 팩토리
├── dependencies/            # 공통 의존성 (디렉토리)
│   ├── auth.py              # JWT 인증 의존성
│   └── db.py                # DB 세션 의존성
├── helpers/                 # DB 헬퍼 유틸
│   └── db.py
├── models/                  # SQLModel 테이블 정의
│   ├── user.py
│   ├── persona.py
│   ├── submission.py
│   ├── score.py
│   ├── ranking.py
│   ├── tournament.py        # 모델만 존재 (라우터 없음)
│   └── credit.py
├── schemas/                 # Pydantic Request/Response 스키마
├── routers/                 # 엔드포인트 (도메인별)
│   ├── auth.py
│   ├── users.py
│   ├── personas.py
│   ├── submissions.py
│   ├── uploads.py
│   ├── rankings.py
│   └── credits.py
└── services/                # 비즈니스 로직
    ├── auth_service.py
    ├── scoring_service.py   # 채점 파이프라인 + stale 복구
    └── credit_service.py
```

---

## 라우터 구조

각 라우터는 `APIRouter(prefix="/...", tags=["..."])` 로 정의.
`main.py`에서 `PREFIX = "/api/v1"` 아래 등록.

| 파일 | Prefix | 설명 |
|---|---|---|
| `auth.py` | `/auth` | 회원가입, 로그인, 토큰 갱신 |
| `users.py` | `/users` | 프로필 조회/수정 |
| `personas.py` | `/personas` | 페르소나 목록/상세 |
| `submissions.py` | `/submissions` | 제출 CRUD + 결과 조회 |
| `uploads.py` | `/uploads` | S3 Presigned URL |
| `rankings.py` | `/rankings` | 주간/월간 랭킹 |
| `credits.py` | `/credits` | 잔액 + 거래 이력 |

> `tournament.py`, `admin.py` 라우터 미구현 (모델만 존재).

---

## 서비스 레이어 역할

| 서비스 | 책임 |
|---|---|
| `auth_service` | 토큰 생성/검증, 비밀번호 해시, OAuth 코드 교환 |
| `scoring_service` | 채점 파이프라인 오케스트레이션, cold start 시 stale submission 복구 |
| `credit_service` | 잔액 조회, 충전/차감, 트랜잭션 기록 (원자적 처리) |

---

## DB 헬퍼 (`helpers/db.py`)

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

## 의존성 주입 (`dependencies/`)

```python
# dependencies/db.py
def get_session() -> Generator[Session, None, None]

# dependencies/auth.py
def get_current_user(token: str = Depends(oauth2_scheme), session = Depends(get_session)) -> User
def require_admin(current_user: User = Depends(get_current_user)) -> User
```

---

## Lifespan / Cold Start 처리 (`main.py`)

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from app.services.scoring_service import recover_stale_submissions
        recover_stale_submissions()
    except Exception:
        pass
    yield
```

Lambda cold start 시 `scoring` 상태에 멈춘 submission을 복구.

---

## 채점 파이프라인 (`services/scoring_service.py`)

BackgroundTasks 기반 동기 처리 (Lambda 환경).

```
1. submission.status = "validating"
2. 표절/저작권 검증
3. 실패 → status = "rejected", reject_reason 저장
4. 성공 → status = "scoring"
5. 5축 기본기 채점 (Whisper + Librosa)
6. 페르소나 가중치 적용
7. LLM 피드백 생성 (Claude API)
8. base_scores, persona_scores, feedbacks 저장
9. ranking_entries 갱신
10. status = "scored"
```

---

## Mangum Lambda 핸들러 (`main.py`)

```python
handler = Mangum(app, lifespan="on")
```

로컬 개발: `uvicorn app.main:app --reload --port 8000`
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

# OAuth
KAKAO_CLIENT_ID=...
GOOGLE_CLIENT_ID=...

# AI
ANTHROPIC_API_KEY=...

# App
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000,https://frontend-eta-eosin.vercel.app
SENTRY_DSN=...
```

---

## CORS 설정

`settings.cors_origins_list`로 화이트리스트 관리. 와일드카드 `*` 금지.

---

## API 문서

`ENVIRONMENT=development` 일 때만 `/docs` (Swagger) 노출. 프로덕션 비활성.

---

## 에러 핸들링

1. `RequestValidationError` → 422 + 필드별 메시지
2. `HTTPException` → 그대로 전달
3. `Exception` (catch-all) → 500, prod에서 내부 메시지 숨김

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
