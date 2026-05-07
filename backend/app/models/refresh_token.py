import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    jti: str = Field(index=True, unique=True, max_length=64)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    expires_at: datetime
    is_revoked: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
