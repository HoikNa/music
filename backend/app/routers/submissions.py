import json
import logging
import os
import uuid
from urllib.parse import urlparse
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlmodel import Session, select

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.helpers.db import fetch_by_id
from app.models.submission import Submission, SubmissionPersona, SubmissionStatus, RankingMode
from app.models.score import BaseScore, PersonaScore, Feedback
from app.models.persona import Persona
from app.models.user import User
from app.services import credit_service
from app.services.scoring_service import run_scoring, _mark_rejected
from app.models.credit import CreditReason

router = APIRouter(prefix="/submissions", tags=["submissions"])
logger = logging.getLogger(__name__)


class SubmissionCreate(BaseModel):
    title: str
    genre: str
    lyrics: str | None = None
    audio_url: str
    duration_sec: int
    ranking_mode: RankingMode = RankingMode.both
    persona_ids: list[uuid.UUID]

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not v or len(v) > 100:
            raise ValueError("title must be 1–100 characters")
        return v

    @field_validator("lyrics")
    @classmethod
    def validate_lyrics(cls, v: str | None) -> str | None:
        if v and len(v) > 5000:
            raise ValueError("lyrics must be ≤ 5000 characters")
        return v

    @field_validator("duration_sec")
    @classmethod
    def validate_duration(cls, v: int) -> int:
        if not (10 <= v <= 600):
            raise ValueError("duration_sec must be 10–600")
        return v

    @field_validator("persona_ids")
    @classmethod
    def validate_persona_ids(cls, v: list[uuid.UUID]) -> list[uuid.UUID]:
        if not (1 <= len(v) <= 3):
            raise ValueError("persona_ids must contain 1–3 items")
        return v


def _serialize_submission(submission: Submission, db: Session) -> dict:
    base_score = db.exec(
        select(BaseScore).where(BaseScore.submission_id == submission.id)
    ).first()

    persona_scores_out = []
    if base_score:
        ps_rows = db.exec(
            select(PersonaScore).where(PersonaScore.submission_id == submission.id)
        ).all()
        for ps in ps_rows:
            persona = db.get(Persona, ps.persona_id)
            feedback = db.exec(
                select(Feedback).where(Feedback.persona_score_id == ps.id)
            ).first()
            persona_scores_out.append({
                "persona_id": str(ps.persona_id),
                "persona_name": persona.display_name if persona else "",
                "score": ps.persona_score,
                "feedback": {
                    "summary": feedback.summary,
                    "strengths": feedback.strengths,
                    "improvements": feedback.improvements,
                } if feedback else None,
            })

    return {
        "id": str(submission.id),
        "submission_id": str(submission.id),
        "title": submission.title,
        "genre": submission.genre,
        "audio_url": submission.audio_url,
        "duration_sec": submission.duration_sec,
        "status": submission.status,
        "reject_reason": submission.reject_reason,
        "ranking_mode": submission.ranking_mode,
        "created_at": submission.created_at.isoformat(),
        "base_score": {
            "pitch": base_score.pitch_score,
            "rhythm": base_score.rhythm_score,
            "range": base_score.range_score,
            "dynamic": base_score.dynamic_score,
            "articulation": base_score.articulation_score,
            "total": base_score.total_score,
        } if base_score else None,
        "persona_scores": persona_scores_out,
    }


def _enqueue_scoring(
    submission_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: Session,
) -> None:
    function_name = os.getenv("AWS_LAMBDA_FUNCTION_NAME")
    if function_name:
        import boto3

        try:
            boto3.client("lambda").invoke(
                FunctionName=function_name,
                InvocationType="Event",
                Payload=json.dumps({
                    "source": "vertualowl.scoring",
                    "submission_id": str(submission_id),
                }).encode("utf-8"),
            )
        except Exception:
            logger.exception("Failed to enqueue scoring for submission %s", submission_id)
            _mark_rejected(db, submission_id, "채점 큐 등록 실패. 크레딧이 환불됩니다.")
        return

    background_tasks.add_task(run_scoring, submission_id)


@router.post("", status_code=201)
def create_submission(
    body: SubmissionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # audio_url 소유권 검증 (credit 차감 전)
    from app.config import settings as _settings
    parsed = urlparse(body.audio_url)
    expected_prefix = f"/audio/{current_user.id}/"
    if not parsed.path.startswith(expected_prefix) or _settings.s3_bucket not in parsed.netloc:
        raise HTTPException(status_code=400, detail="Invalid audio_url")

    # persona 유효성 선검증 (credit 차감 전)
    from app.models.persona import Persona
    for pid in body.persona_ids:
        persona = db.get(Persona, pid)
        if not persona or not persona.is_active:
            raise HTTPException(status_code=400, detail=f"Invalid persona: {pid}")

    # submission, credit 차감, persona 연결을 단일 트랜잭션으로
    submission = Submission(
        user_id=current_user.id,
        title=body.title,
        genre=body.genre,
        lyrics=body.lyrics,
        audio_url=body.audio_url,
        duration_sec=body.duration_sec,
        ranking_mode=body.ranking_mode,
        status=SubmissionStatus.pending,
    )
    db.add(submission)
    db.flush()  # submission.id 확보

    for pid in body.persona_ids:
        db.add(SubmissionPersona(submission_id=submission.id, persona_id=pid))

    # credit 차감 (commit=False → 위 작업과 같은 트랜잭션)
    credit_service.deduct_credit(
        db, current_user.id, 1, CreditReason.submission,
        submission_id=submission.id, commit=False,
    )

    db.commit()
    db.refresh(submission)
    _enqueue_scoring(submission.id, background_tasks, db)
    return _serialize_submission(submission, db)


@router.get("")
def list_submissions(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Submission)
        .where(Submission.user_id == current_user.id, ~Submission.is_deleted)
        .order_by(Submission.created_at.desc())
        .offset(skip)
        .limit(limit + 1)
    )
    rows = db.exec(stmt).all()
    has_more = len(rows) > limit
    items = rows[:limit]
    return {
        "items": [_serialize_submission(s, db) for s in items],
        "has_more": has_more,
        "next_cursor": str(items[-1].id) if has_more else None,
    }


@router.get("/{submission_id}")
def get_submission(
    submission_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    submission = fetch_by_id(db, Submission, submission_id)
    if submission.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return _serialize_submission(submission, db)


@router.delete("/{submission_id}", status_code=204)
def delete_submission(
    submission_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from datetime import datetime
    submission = fetch_by_id(db, Submission, submission_id)
    if submission.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    submission.is_deleted = True
    submission.deleted_at = datetime.utcnow()
    db.add(submission)
    db.commit()
