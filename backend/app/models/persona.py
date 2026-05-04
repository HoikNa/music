import uuid
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel


class PersonaDimension(str, Enum):
    pitch = "pitch"
    rhythm = "rhythm"
    range = "range"
    dynamic = "dynamic"
    articulation = "articulation"


class Persona(SQLModel, table=True):
    __tablename__ = "personas"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, max_length=50)
    display_name: str = Field(max_length=100)
    genre: str = Field(max_length=50)
    image_url: Optional[str] = Field(default=None, max_length=512)
    description: Optional[str] = Field(default=None)
    is_active: bool = Field(default=True)
    sort_order: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PersonaWeight(SQLModel, table=True):
    __tablename__ = "persona_weights"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    persona_id: uuid.UUID = Field(foreign_key="personas.id", index=True)
    dimension: PersonaDimension
    multiplier: float = Field(default=1.0)
    bonus_threshold: Optional[float] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
