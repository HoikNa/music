import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, Any
from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class SubmissionStatus(str, Enum):
    pending = "pending"
    validating = "validating"
    scoring = "scoring"
    scored = "scored"
    rejected = "rejected"


class RankingMode(str, Enum):
    ranking = "ranking"
    challenge = "challenge"
    both = "both"


class Submission(SQLModel, table=True):
    __tablename__ = "submissions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    title: str = Field(max_length=200)
    genre: str = Field(max_length=50)
    lyrics: Optional[str] = Field(default=None)
    audio_url: str = Field(max_length=512)
    duration_sec: int
    status: SubmissionStatus = Field(default=SubmissionStatus.pending, index=True)
    reject_reason: Optional[str] = Field(default=None)
    ranking_mode: RankingMode = Field(default=RankingMode.both)
    credit_used: int = Field(default=1)
    is_ranking_excluded: bool = Field(default=False, index=True)
    abuse_risk_score: float = Field(default=0.0)
    abuse_flags: Optional[dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class SubmissionPersona(SQLModel, table=True):
    __tablename__ = "submission_personas"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    submission_id: uuid.UUID = Field(foreign_key="submissions.id", index=True)
    persona_id: uuid.UUID = Field(foreign_key="personas.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
