import uuid
from datetime import datetime
from enum import Enum
from typing import Any

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class GeneratedAssetType(str, Enum):
    lyrics = "lyrics"
    composition = "composition"
    mastering = "mastering"


class GeneratedAssetStatus(str, Enum):
    queued = "queued"
    running = "running"
    succeeded = "succeeded"
    failed = "failed"
    skipped = "skipped"


class GeneratedAsset(SQLModel, table=True):
    __tablename__ = "generated_assets"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    asset_type: GeneratedAssetType = Field(index=True)
    status: GeneratedAssetStatus = Field(default=GeneratedAssetStatus.queued, index=True)
    provider: str = Field(max_length=50)
    model: str | None = Field(default=None, max_length=100)
    prompt: str | None = Field(default=None)
    input_data: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    output_text: str | None = Field(default=None)
    output_url: str | None = Field(default=None, max_length=512)
    source_submission_id: uuid.UUID | None = Field(default=None, foreign_key="submissions.id")
    error_message: str | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
