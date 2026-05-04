import uuid
from datetime import datetime
from typing import Optional, Any
from sqlmodel import Field, SQLModel, Column
from sqlalchemy import JSON


class BaseScore(SQLModel, table=True):
    __tablename__ = "base_scores"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    submission_id: uuid.UUID = Field(foreign_key="submissions.id", unique=True, index=True)
    pitch_score: float = Field(default=0.0)
    rhythm_score: float = Field(default=0.0)
    range_score: float = Field(default=0.0)
    dynamic_score: float = Field(default=0.0)
    articulation_score: float = Field(default=0.0)
    total_score: float = Field(default=0.0)
    processing_sec: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PersonaScore(SQLModel, table=True):
    __tablename__ = "persona_scores"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    submission_id: uuid.UUID = Field(foreign_key="submissions.id", index=True)
    persona_id: uuid.UUID = Field(foreign_key="personas.id", index=True)
    base_score_id: uuid.UUID = Field(foreign_key="base_scores.id")
    persona_score: float = Field(default=0.0)
    weighted_breakdown: Optional[dict[str, Any]] = Field(
        default=None, sa_column=Column(JSON)
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Feedback(SQLModel, table=True):
    __tablename__ = "feedbacks"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    persona_score_id: uuid.UUID = Field(foreign_key="persona_scores.id", unique=True, index=True)
    summary: str
    strengths: list[dict[str, str]] = Field(sa_column=Column(JSON))
    improvements: list[dict[str, str]] = Field(sa_column=Column(JSON))
    next_challenge: Optional[dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    model_version: str = Field(max_length=50, default="claude-sonnet-4-6")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
