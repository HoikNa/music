import logging
import uuid


logger = logging.getLogger(__name__)
_fastapi_app = None
_asgi_handler = None
_sentry_initialized = False


def _init_sentry(settings):
    global _sentry_initialized
    if _sentry_initialized or not settings.sentry_dsn:
        return

    import sentry_sdk

    sentry_sdk.init(dsn=settings.sentry_dsn, environment=settings.environment)
    _sentry_initialized = True


def _build_app():
    from contextlib import asynccontextmanager

    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    from app.config import settings
    from app.routers import auth, ai, credits, personas, rankings, submissions, tournament, uploads, users

    _init_sentry(settings)

    @asynccontextmanager
    async def lifespan(app):
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

    prefix = "/api/v1"
    app.include_router(auth.router, prefix=prefix)
    app.include_router(submissions.router, prefix=prefix)
    app.include_router(uploads.router, prefix=prefix)
    app.include_router(personas.router, prefix=prefix)
    app.include_router(rankings.router, prefix=prefix)
    app.include_router(credits.router, prefix=prefix)
    app.include_router(users.router, prefix=prefix)
    app.include_router(tournament.router, prefix=prefix)
    app.include_router(ai.router, prefix=prefix)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app


def _get_app():
    global _fastapi_app
    if _fastapi_app is None:
        _fastapi_app = _build_app()
    return _fastapi_app


class LazyASGIApp:
    def __getattr__(self, name):
        return getattr(_get_app(), name)

    async def __call__(self, scope, receive, send):
        await _get_app()(scope, receive, send)


app = LazyASGIApp()


def _get_asgi_handler():
    global _asgi_handler
    if _asgi_handler is None:
        from mangum import Mangum

        _asgi_handler = Mangum(_get_app(), lifespan="on")
    return _asgi_handler


def handler(event, context):
    if event.get("source") == "vertualowl.scoring":
        from app.services.scoring_service import run_scoring
        run_scoring(uuid.UUID(event["submission_id"]))
        return {"ok": True}
    if event.get("source") == "vertualowl.feedback_tts":
        from app.services.feedback_tts_service import run_feedback_tts
        run_feedback_tts(uuid.UUID(event["feedback_id"]))
        return {"ok": True}
    return _get_asgi_handler()(event, context)
