"""Recover submissions stuck in transient processing states."""
import logging
from datetime import datetime, timedelta

from sqlmodel import Session, create_engine, select

from app.config import settings
from app.models.credit import CreditReason
from app.models.submission import Submission, SubmissionStatus
from app.services import credit_service

logger = logging.getLogger(__name__)


def _mark_timeout_rejected(db: Session, submission: Submission) -> None:
    if submission.status in (SubmissionStatus.scored, SubmissionStatus.rejected):
        return
    submission.status = SubmissionStatus.rejected
    submission.reject_reason = "채점 시간 초과. 크레딧이 환불됩니다."
    submission.updated_at = datetime.utcnow()
    db.add(submission)
    credit_service.add_credit(
        db,
        submission.user_id,
        1,
        CreditReason.refund,
        note=f"채점 실패 환불 (submission {submission.id})",
    )


def recover_stale_submissions() -> None:
    engine = create_engine(settings.database_url)
    with Session(engine) as db:
        cutoff = datetime.utcnow() - timedelta(minutes=settings.stale_submission_timeout_minutes)
        stale = db.exec(
            select(Submission).where(
                Submission.status.in_([SubmissionStatus.validating, SubmissionStatus.scoring]),
                Submission.updated_at < cutoff,
                ~Submission.is_deleted,
            )
        ).all()
        for submission in stale:
            _mark_timeout_rejected(db, submission)
        db.commit()
