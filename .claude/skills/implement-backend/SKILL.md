---
name: implement-backend
description: 4단계 백엔드 구현. 프론트 완료 후 호출. FastAPI + SQLModel + AWS Lambda 셋업 및 API 구현. "백엔드 시작", "4단계", "FastAPI", "API 구현" 시 호출.
---

# 4단계: 백엔드 구현

설계 문서 기반으로 FastAPI + Mangum + SQLModel 구현.
AWS Lambda 배포 가능한 구조.

## 폴더 구조
```
backend/
├── app/
│   ├── main.py              ← FastAPI 앱 + Mangum 핸들러
│   ├── config.py            ← 환경변수 로드
│   ├── database.py          ← DB 연결 + 세션
│   ├── models/              ← SQLModel 모델
│   │   ├── __init__.py
│   │   └── [도메인].py
│   ├── routers/             ← FastAPI 라우터 (도메인별)
│   │   ├── __init__.py
│   │   └── [도메인].py
│   ├── services/            ← 비즈니스 로직
│   │   └── [도메인].py
│   ├── helpers/             ← 고수준 DB Helper
│   │   └── db.py
│   ├── dependencies/        ← 의존성 주입
│   │   ├── auth.py
│   │   └── db.py
│   └── schemas/             ← Pydantic 입출력 스키마
│       └── [도메인].py
├── migrations/              ← Alembic
│   ├── versions/
│   └── env.py
├── .env                     ← 실제 값 (git 제외)
├── .env.example             ← 키만 (git 포함)
├── requirements.txt
├── alembic.ini
└── handler.py               ← Lambda 진입점
```

## 환경 셋업

### 패키지 설치
```bash
pip install fastapi mangum sqlmodel alembic psycopg2-binary
pip install pydantic-settings python-dotenv python-jose passlib bcrypt
pip install boto3 sentry-sdk
```

### `requirements.txt` 내용
```
fastapi==0.136.1
mangum==0.21.0
sqlmodel==0.0.38
alembic==1.18.4
psycopg2-binary==2.9.12
pydantic-settings==2.14.0
python-dotenv==1.2.2
python-jose[cryptography]==3.5.0
passlib[bcrypt]==1.7.4
bcrypt==4.0.1
boto3==1.43.2
sentry-sdk==2.58.0
uvicorn==0.46.0
pydantic[email]>=2.0.0
```

### `.env.example` 내용
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60
AWS_REGION=ap-northeast-2
SENTRY_DSN=
ENVIRONMENT=development
```

## 핵심 파일 구현

### `app/config.py` (환경변수)
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60
    environment: str = "development"
    sentry_dsn: str | None = None

    class Config:
        env_file = ".env"

settings = Settings()
```

### `app/database.py` (DB 연결)
```python
from sqlmodel import SQLModel, create_engine, Session
from app.config import settings

engine = create_engine(settings.database_url)

def create_db():
    SQLModel.metadata.create_all(engine)

def get_db():
    with Session(engine) as session:
        yield session
```

### `app/helpers/db.py` (고수준 DB Helper)
```python
# Django 스타일 고수준 Helper
# 반복 패턴을 추상화하여 라우터 코드 단순화

def fetch_by_id(session, model, id):
    """ID로 단일 조회, 없으면 404"""

def fetch_list(session, model, skip=0, limit=20, **filters):
    """목록 조회 (페이징 + 필터)"""

def create_item(session, model, data):
    """생성 + 자동 commit"""

def update_item(session, item, data):
    """수정 + 자동 commit"""

def soft_delete(session, item):
    """Soft Delete (is_deleted=True)"""
```

### `app/main.py` (FastAPI + Mangum)
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from app.routers import [도메인1], [도메인2]

app = FastAPI(
    title="[프로젝트명] API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://[vercel-url].vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router([도메인1].router, prefix="/api/v1")
app.include_router([도메인2].router, prefix="/api/v1")

# AWS Lambda 핸들러
handler = Mangum(app, lifespan="off")
```

### `handler.py` (Lambda 진입점)
```python
from app.main import handler
```

### `app/dependencies/auth.py` (인증 의존성)
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def get_current_user(token = Depends(security)):
    """JWT 검증 후 현재 유저 반환"""
    ...
```

## Alembic 셋업
```bash
# 초기화 (한 번만)
alembic init migrations

# 마이그레이션 파일 생성
alembic revision --autogenerate -m "초기 스키마"

# 적용
alembic upgrade head
```

## API 구현 패턴
```python
# routers/[도메인].py
from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.helpers.db import fetch_list, fetch_by_id, create_item, update_item
from app.models.[도메인] import [모델]
from app.schemas.[도메인] import [입력Schema], [출력Schema]

router = APIRouter(prefix="/[도메인]", tags=["[도메인]"])

@router.get("/", response_model=list[[출력Schema]])
async def get_list(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return fetch_list(db, [모델], skip=skip, limit=limit)

@router.post("/", response_model=[출력Schema])
async def create(
    data: [입력Schema],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return create_item(db, [모델], data)
```

## 개발 규칙 문서 생성
구현 전 다음 파일 생성:
```
docs/
├── backend-dev-instruction.md   ← DB Helper 사용법, 환경변수 규칙, 인증 패턴
└── openapi.json                 ← API 명세 자동 생성 (구현 후)
```

## OpenAPI 자동 생성
구현 완료 후:
```bash
# FastAPI 자동 생성 OpenAPI 스펙 저장
curl http://localhost:8000/openapi.json > docs/openapi.json
```

## 완료 시
"백엔드 구현 완료. 5단계 통합을 시작하려면 /run-tests 를 입력하세요."
