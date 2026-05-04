"""add_creditreason_signup_bonus_reward

Revision ID: 365a997d76a2
Revises: 4d0fa5dfb7f6
Create Date: 2026-05-05 00:03:01.536179

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = '365a997d76a2'
down_revision: Union[str, None] = '4d0fa5dfb7f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE creditreason ADD VALUE IF NOT EXISTS 'signup_bonus'")
    op.execute("ALTER TYPE creditreason ADD VALUE IF NOT EXISTS 'reward'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values; downgrade is a no-op
    pass
