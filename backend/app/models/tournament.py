import uuid
from datetime import datetime
from enum import Enum
from sqlmodel import Field, SQLModel


class TicketStatus(str, Enum):
    unused = "unused"
    used = "used"
    expired = "expired"


class TournamentTicket(SQLModel, table=True):
    __tablename__ = "tournament_tickets"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    persona_id: uuid.UUID = Field(foreign_key="personas.id", index=True)
    submission_id: uuid.UUID = Field(foreign_key="submissions.id", index=True)
    status: TicketStatus = Field(default=TicketStatus.unused, index=True)
    expires_at: datetime
    used_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
