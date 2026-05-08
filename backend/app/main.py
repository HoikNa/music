import logging
import sentry_sdk
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app.config import settings
from app.routers import auth, submissions, uploads, personas, rankings, credits, users, tournament, ai

if settings.sentry_dsn:
    sentry_sdk.init(dsn=settings.sentry_dsn, environment=settings.environment)


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not settings.recover_stale_on_startup:
        yield
        return

    # cold start 시 stale submission 복구
    try:
        from app.services.stale_submission_service import recover_stale_submissions
        recover_stale_submissions()
    except Exception:
        logger.exception("stale submission 복구 실패")
    yield


app = FastAPI(
    title="Vertual Owl API",
    version="1.0.0",
    docs_url="/docs" if settings.environment == "development" else None,
    redoc_url=None,
    redirect_slashes=False,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"
app.include_router(auth.router, prefix=PREFIX)
app.include_router(submissions.router, prefix=PREFIX)
app.include_router(uploads.router, prefix=PREFIX)
app.include_router(personas.router, prefix=PREFIX)
app.include_router(rankings.router, prefix=PREFIX)
app.include_router(credits.router, prefix=PREFIX)
app.include_router(users.router, prefix=PREFIX)
app.include_router(tournament.router, prefix=PREFIX)
app.include_router(ai.router, prefix=PREFIX)


@app.get("/health")
def health():
    return {"status": "ok"}


asgi_handler = Mangum(app, lifespan="on")


def handler(event, context):
    if event.get("source") == "vertualowl.scoring":
        from app.services.scoring_service import run_scoring
        run_scoring(uuid.UUID(event["submission_id"]))
        return {"ok": True}
    if event.get("source") == "vertualowl.feedback_tts":
        from app.services.feedback_tts_service import run_feedback_tts
        run_feedback_tts(uuid.UUID(event["feedback_id"]))
        return {"ok": True}
    return asgi_handler(event, context)
