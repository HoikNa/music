import uuid
from datetime import datetime
from enum import Enum
from typing import Any

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class ValidationCheckType(str, Enum):
    moderation = "moderation"
    plagiarism = "plagiarism"
    ai_generated = "ai_generated"


class ValidationStatus(str, Enum):
    passed = "passed"
    failed = "failed"
    skipped = "skipped"
    error = "error"


class SubmissionValidationCheck(SQLModel, table=True):
    __tablename__ = "submission_validation_checks"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    submission_id: uuid.UUID = Field(foreign_key="submissions.id", index=True)
    check_type: ValidationCheckType = Field(index=True)
    status: ValidationStatus = Field(index=True)
    provider: str = Field(max_length=50)
    score: float | None = Field(default=None)
    reason: str | None = Field(default=None)
    result: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
