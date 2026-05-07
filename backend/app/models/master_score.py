import uuid
from datetime import datetime

from sqlmodel import Field, SQLModel


class MasterScore(SQLModel, table=True):
    __tablename__ = "master_scores"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    persona_id: uuid.UUID = Field(foreign_key="personas.id", index=True)
    target_score: float
    is_active: bool = Field(default=True, index=True)
    valid_from: datetime = Field(default_factory=datetime.utcnow)
    valid_until: datetime | None = Field(default=None)
    created_by: uuid.UUID = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
