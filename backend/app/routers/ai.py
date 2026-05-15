import json
import logging
import os
import uuid
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from sqlmodel import Session, select

from app.constants.genres import genre_label, normalize_genre
from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.generated_asset import GeneratedAsset, GeneratedAssetStatus, GeneratedAssetType
from app.models.submission import Submission
from app.models.user import User

router = APIRouter(prefix="/ai", tags=["ai"])
logger = logging.getLogger(__name__)


UNSAFE_LYRICS_PROMPT_TERMS = (
    "미성년 성적",
    "아동 성적",
    "강간",
    "rape",
    "child sexual",
    "suicide method",
    "자살 방법",
    "폭탄 제조",
    "make a bomb",
)


class LyricsRequest(BaseModel):
    theme: str = Field(min_length=1, max_length=300)
    genre: str = Field(default="VOVATAR_POP", max_length=50)
    mood: str = Field(default="emotional", max_length=100)
    keywords: list[str] = Field(default_factory=list, max_length=12)

    @field_validator("theme", "genre", "mood")
    @classmethod
    def strip_text_fields(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("field cannot be blank")
        return value

    @field_validator("genre")
    @classmethod
    def validate_genre(cls, value: str) -> str:
        try:
            return normalize_genre(value)
        except ValueError as exc:
            raise ValueError("genre must be one of the official Vertual Owl music genres") from exc

    @field_validator("keywords")
    @classmethod
    def validate_keywords(cls, value: list[str]) -> list[str]:
        cleaned: list[str] = []
        for keyword in value:
            keyword = keyword.strip()
            if not keyword:
                continue
            if len(keyword) > 30:
                raise ValueError("keyword must be 30 characters or fewer")
            cleaned.append(keyword)
        return cleaned


class ComposeRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=600)
    genre: str = Field(default="VOVATAR_POP", max_length=50)
    mood: str = Field(default="emotional", max_length=100)
    duration_sec: int = Field(default=60, ge=15, le=180)

    @field_validator("genre")
    @classmethod
    def validate_genre(cls, value: str) -> str:
        try:
            return normalize_genre(value)
        except ValueError as exc:
            raise ValueError("genre must be one of the official Vertual Owl music genres") from exc


class MasteringRequest(BaseModel):
    audio_url: str | None = None
    submission_id: uuid.UUID | None = None
    target_lufs: float | None = None


def _serialize_asset(asset: GeneratedAsset) -> dict:
    return {
        "id": str(asset.id),
        "asset_type": asset.asset_type,
        "status": asset.status,
        "provider": asset.provider,
        "model": asset.model,
        "prompt": asset.prompt,
        "input_data": asset.input_data,
        "output_text": asset.output_text,
        "output_url": asset.output_url,
        "source_submission_id": str(asset.source_submission_id) if asset.source_submission_id else None,
        "error_message": asset.error_message,
        "created_at": asset.created_at.isoformat(),
    }


@router.get("/assets")
def list_assets(
    asset_type: GeneratedAssetType | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(GeneratedAsset).where(GeneratedAsset.user_id == current_user.id)
    if asset_type:
        statement = statement.where(GeneratedAsset.asset_type == asset_type)
    statement = statement.order_by(GeneratedAsset.created_at.desc()).offset(offset).limit(limit)
    assets = db.exec(statement).all()
    return {"items": [_serialize_asset(asset) for asset in assets]}


def process_mastering_asset(db: Session, asset_id: uuid.UUID) -> None:
    from app.services import mastering_service

    asset = db.get(GeneratedAsset, asset_id)
    if not asset or asset.asset_type != GeneratedAssetType.mastering:
        return
    if asset.status not in (GeneratedAssetStatus.queued, GeneratedAssetStatus.running):
        return

    input_data = asset.input_data or {}
    audio_url = input_data.get("audio_url")
    target_lufs = input_data.get("target_lufs")
    if not isinstance(audio_url, str) or not audio_url.strip():
        asset.status = GeneratedAssetStatus.failed
        asset.error_message = "audio_url is missing"
        asset.updated_at = datetime.utcnow()
        db.add(asset)
        db.commit()
        return

    asset.status = GeneratedAssetStatus.running
    asset.error_message = None
    asset.updated_at = datetime.utcnow()
    db.add(asset)
    db.commit()

    try:
        result = mastering_service.master_audio(
            audio_url=audio_url,
            user_id=str(asset.user_id),
            target_lufs=target_lufs if isinstance(target_lufs, (int, float)) else None,
        )
        status_value = GeneratedAssetStatus(result["status"])
        asset = db.get(GeneratedAsset, asset_id)
        if not asset:
            return
        asset.status = status_value
        asset.provider = result.get("provider") or asset.provider
        asset.output_url = result.get("audio_url")
        asset.error_message = None if status_value == GeneratedAssetStatus.succeeded else result.get("message")
        asset.updated_at = datetime.utcnow()
        db.add(asset)
        db.commit()
    except Exception as exc:
        logger.exception("Failed to process mastering asset %s", asset_id)
        asset = db.get(GeneratedAsset, asset_id)
        if asset:
            asset.status = GeneratedAssetStatus.failed
            asset.error_message = str(exc)[:500]
            asset.updated_at = datetime.utcnow()
            db.add(asset)
            db.commit()


def run_mastering(asset_id: uuid.UUID) -> None:
    from sqlmodel import create_engine
    from app.config import settings

    engine = create_engine(settings.database_url)
    with Session(engine) as db:
        process_mastering_asset(db, asset_id)


def _enqueue_mastering(asset_id: uuid.UUID, background_tasks: BackgroundTasks) -> None:
    function_name = os.getenv("AWS_LAMBDA_FUNCTION_NAME")
    if function_name:
        import boto3

        try:
            boto3.client("lambda").invoke(
                FunctionName=function_name,
                InvocationType="Event",
                Payload=json.dumps({
                    "source": "vertualowl.mastering",
                    "asset_id": str(asset_id),
                }).encode("utf-8"),
            )
            return
        except Exception:
            logger.exception("Failed to enqueue mastering asset %s", asset_id)

    background_tasks.add_task(run_mastering, asset_id)


def _reject_unsafe_lyrics_prompt(body: LyricsRequest) -> None:
    combined = " ".join([body.theme, body.genre, body.mood, *body.keywords]).lower()
    matched = next((term for term in UNSAFE_LYRICS_PROMPT_TERMS if term.lower() in combined), None)
    if matched:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "UNSAFE_LYRICS_PROMPT",
                "message": "Lyrics prompt violates safety rules",
                "matched_term": matched,
            },
        )


@router.post("/lyrics", status_code=201)
def generate_lyrics(
    body: LyricsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services import lyrics_service

    _reject_unsafe_lyrics_prompt(body)
    display_genre = genre_label(body.genre)
    prompt = f"{body.theme} / {display_genre} / {body.mood}"
    result = lyrics_service.generate_lyrics(
        theme=body.theme,
        genre=display_genre,
        mood=body.mood,
        keywords=body.keywords,
    )
    input_data = body.model_dump()
    if result.fallback_reason:
        input_data["metadata"] = {"fallback_reason": result.fallback_reason}
    asset = GeneratedAsset(
        user_id=current_user.id,
        asset_type=GeneratedAssetType.lyrics,
        status=GeneratedAssetStatus.succeeded,
        provider=result.provider,
        model=result.model,
        prompt=prompt,
        input_data=input_data,
        output_text=result.lyrics,
        error_message=result.error_message,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return _serialize_asset(asset)


@router.post("/compose", status_code=201)
def compose_track(
    body: ComposeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services import music_generation_service

    display_genre = genre_label(body.genre)
    result = music_generation_service.generate_demo_track(
        prompt=body.prompt,
        genre=display_genre,
        mood=body.mood,
        duration_sec=body.duration_sec,
    )
    status_value = result["status"]
    asset = GeneratedAsset(
        user_id=current_user.id,
        asset_type=GeneratedAssetType.composition,
        status=GeneratedAssetStatus(status_value),
        provider=result["provider"],
        model=result.get("model"),
        prompt=body.prompt,
        input_data=body.model_dump() | {"metadata": result.get("metadata", {})},
        output_text=result.get("output_text"),
        output_url=result["audio_url"],
        error_message=None if status_value == "succeeded" else result["message"],
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return _serialize_asset(asset)


@router.post("/mastering", status_code=202)
def master_audio(
    body: MasteringRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    audio_url = body.audio_url
    source_submission_id = body.submission_id
    if source_submission_id:
        submission = db.get(Submission, source_submission_id)
        if not submission or submission.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
        audio_url = submission.audio_url

    if not audio_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="audio_url or submission_id required")

    input_data = body.model_dump() | {"audio_url": audio_url}
    asset = GeneratedAsset(
        user_id=current_user.id,
        asset_type=GeneratedAssetType.mastering,
        status=GeneratedAssetStatus.queued,
        provider="ffmpeg",
        prompt=f"target_lufs={body.target_lufs}",
        input_data=input_data,
        source_submission_id=source_submission_id,
        updated_at=datetime.utcnow(),
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    _enqueue_mastering(asset.id, background_tasks)
    return _serialize_asset(asset)
