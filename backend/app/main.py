from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app.config import settings
from app.routers import auth, submissions, uploads, personas, rankings, credits

app = FastAPI(
    title="Vertual Owl API",
    version="1.0.0",
    docs_url="/docs" if settings.environment == "development" else None,
    redoc_url=None,
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


@app.get("/health")
def health():
    return {"status": "ok"}


handler = Mangum(app, lifespan="off")
