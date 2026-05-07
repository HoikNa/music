import logging

from sqlmodel import Session

from app.config import settings
from app.models.submission import Submission
from app.models.validation import (
    SubmissionValidationCheck,
    ValidationCheckType,
    ValidationStatus,
)
from app.services import acrcloud_service, moderation_service

logger = logging.getLogger(__name__)


class ValidationFailed(RuntimeError):
    pass


def _record(
    db: Session,
    submission: Submission,
    check_type: ValidationCheckType,
    status: str,
    provider: str,
    score: float | None = None,
    reason: str | None = None,
    result: dict | None = None,
) -> None:
    db.add(
        SubmissionValidationCheck(
            submission_id=submission.id,
            check_type=check_type,
            status=ValidationStatus(status),
            provider=provider,
            score=score,
            reason=reason,
            result=result,
        )
    )
    db.flush()


def _handle_result(
    db: Session,
    submission: Submission,
    check_type: ValidationCheckType,
    result,
    failure_message: str,
) -> None:
    _record(
        db,
        submission,
        check_type,
        result.status,
        result.provider,
        result.score,
        result.reason,
        result.result,
    )
    if result.status == ValidationStatus.failed.value:
        raise ValidationFailed(failure_message)
    if result.status == ValidationStatus.error.value and settings.validation_strict_mode:
        raise ValidationFailed(f"{failure_message}: validation provider error")
    if result.status == ValidationStatus.error.value:
        logger.warning(
            "Validation provider error ignored for submission %s: %s",
            submission.id,
            result.reason,
        )


def run_submission_validation(db: Session, submission: Submission) -> None:
    _handle_result(
        db,
        submission,
        ValidationCheckType.moderation,
        moderation_service.moderate_text(submission.lyrics),
        "Inappropriate content detected",
    )
    _handle_result(
        db,
        submission,
        ValidationCheckType.plagiarism,
        acrcloud_service.check_plagiarism(submission.audio_url),
        "Potential plagiarism detected",
    )
    _handle_result(
        db,
        submission,
        ValidationCheckType.ai_generated,
        acrcloud_service.check_ai_generated(submission.audio_url),
        "AI-generated audio detected",
    )
