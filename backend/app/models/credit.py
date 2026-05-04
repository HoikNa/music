import uuid
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel


class CreditReason(str, Enum):
    signup_bonus = "signup_bonus"
    purchase = "purchase"
    submission = "submission"
    reward = "reward"
    refund = "refund"
    bonus = "bonus"
    admin = "admin"


class Credit(SQLModel, table=True):
    __tablename__ = "credits"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", unique=True, index=True)
    balance: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CreditTransaction(SQLModel, table=True):
    __tablename__ = "credit_transactions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    amount: int
    reason: CreditReason
    submission_id: Optional[uuid.UUID] = Field(default=None, foreign_key="submissions.id")
    note: Optional[str] = Field(default=None, max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)
