import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.generated_asset import GeneratedAsset, GeneratedAssetStatus, GeneratedAssetType
from app.models.submission import Submission
from app.models.user import User
from app.services import lyrics_service, mastering_service, music_generation_service

router = APIRouter(prefix="/ai", tags=["ai"])


class LyricsRequest(BaseModel):
    theme: str = Field(min_length=1, max_length=300)
    genre: str = Field(default="K-POP", max_length=50)
    mood: str = Field(default="emotional", max_length=100)
    keywords: list[str] = Field(default_factory=list, max_length=12)


class ComposeRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=600)
    genre: str = Field(default="K-POP", max_length=50)
    mood: str = Field(default="emotional", max_length=100)
    duration_sec: int = Field(default=60, ge=15, le=180)


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
        "output_text": asset.output_text,
        "output_url": asset.output_url,
        "error_message": asset.error_message,
        "created_at": asset.created_at.isoformat(),
    }


@router.post("/lyrics", status_code=201)
def generate_lyrics(
    body: LyricsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prompt = f"{body.theme} / {body.genre} / {body.mood}"
    lyrics, provider, model = lyrics_service.generate_lyrics(
        theme=body.theme,
        genre=body.genre,
        mood=body.mood,
        keywords=body.keywords,
    )
    asset = GeneratedAsset(
        user_id=current_user.id,
        asset_type=GeneratedAssetType.lyrics,
        status=GeneratedAssetStatus.succeeded,
        provider=provider,
        model=model,
        prompt=prompt,
        input_data=body.model_dump(),
        output_text=lyrics,
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
    result = music_generation_service.generate_demo_track(
        prompt=body.prompt,
        genre=body.genre,
        mood=body.mood,
        duration_sec=body.duration_sec,
    )
    status_value = result["status"]
    asset = GeneratedAsset(
        user_id=current_user.id,
        asset_type=GeneratedAssetType.composition,
        status=GeneratedAssetStatus(status_value),
        provider=result["provider"],
        model=None,
        prompt=body.prompt,
        input_data=body.model_dump() | {"metadata": result.get("metadata", {})},
        output_url=result["audio_url"],
        error_message=None if status_value == "succeeded" else result["message"],
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return _serialize_asset(asset)


@router.post("/mastering", status_code=201)
def master_audio(
    body: MasteringRequest,
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

    result = mastering_service.master_audio(
        audio_url=audio_url,
        user_id=str(current_user.id),
        target_lufs=body.target_lufs,
    )
    status_value = result["status"]
    asset = GeneratedAsset(
        user_id=current_user.id,
        asset_type=GeneratedAssetType.mastering,
        status=GeneratedAssetStatus(status_value),
        provider=result["provider"],
        prompt=f"target_lufs={body.target_lufs}",
        input_data=body.model_dump(),
        output_url=result["audio_url"],
        source_submission_id=source_submission_id,
        error_message=None if status_value == "succeeded" else result["message"],
        updated_at=datetime.utcnow(),
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return _serialize_asset(asset)
