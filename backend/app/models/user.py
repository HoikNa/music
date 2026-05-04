import uuid
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel


class UserRole(str, Enum):
    creator = "creator"
    fan = "fan"
    admin = "admin"


class AuthProvider(str, Enum):
    email = "email"
    kakao = "kakao"
    google = "google"


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True, max_length=255)
    hashed_password: Optional[str] = Field(default=None, max_length=255)
    nickname: str = Field(unique=True, index=True, max_length=50)
    role: UserRole = Field(default=UserRole.creator)
    provider: AuthProvider = Field(default=AuthProvider.email)
    provider_id: Optional[str] = Field(default=None, max_length=255)
    profile_image_url: Optional[str] = Field(default=None, max_length=512)
    bio: Optional[str] = Field(default=None)
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
