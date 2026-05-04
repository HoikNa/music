import uuid
from datetime import datetime, date
from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel


class PeriodType(str, Enum):
    weekly = "weekly"
    monthly = "monthly"


class PeriodStatus(str, Enum):
    active = "active"
    closed = "closed"
    archived = "archived"


class RankingPeriod(SQLModel, table=True):
    __tablename__ = "ranking_periods"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    persona_id: uuid.UUID = Field(foreign_key="personas.id", index=True)
    period_type: PeriodType
    start_date: date
    end_date: date
    status: PeriodStatus = Field(default=PeriodStatus.active, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class RankingEntry(SQLModel, table=True):
    __tablename__ = "ranking_entries"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    period_id: uuid.UUID = Field(foreign_key="ranking_periods.id", index=True)
    submission_id: uuid.UUID = Field(foreign_key="submissions.id", index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    rank: int
    previous_rank: Optional[int] = Field(default=None)
    persona_score: float = Field(default=0.0)
    vote_count: int = Field(default=0)
    is_survived: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
