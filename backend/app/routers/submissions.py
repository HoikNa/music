import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.helpers.db import fetch_by_id, fetch_list
from app.models.submission import Submission, SubmissionPersona, SubmissionStatus, RankingMode
from app.models.user import User
from app.services import credit_service
from app.models.credit import CreditReason

router = APIRouter(prefix="/submissions", tags=["submissions"])


class SubmissionCreate(BaseModel):
    title: str
    genre: str
    lyrics: str | None = None
    audio_url: str
    duration_sec: int
    ranking_mode: RankingMode = RankingMode.both
    persona_ids: list[uuid.UUID]


@router.post("/", status_code=201)
def create_submission(
    body: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    credit_service.deduct_credit(
        db, current_user.id, 1, CreditReason.submission
    )

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
    db.flush()

    for pid in body.persona_ids:
        db.add(SubmissionPersona(submission_id=submission.id, persona_id=pid))

    db.commit()
    db.refresh(submission)
    return submission


@router.get("/")
def list_submissions(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return fetch_list(db, Submission, skip=skip, limit=limit, user_id=current_user.id, is_deleted=False)


@router.get("/{submission_id}")
def get_submission(
    submission_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    submission = fetch_by_id(db, Submission, submission_id)
    if submission.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return submission


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
