"""add_master_scores_table

Revision ID: b05c0001
Revises: a1b2c3d4e5f6
Create Date: 2026-05-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b05c0001"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "master_scores",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("persona_id", sa.Uuid(), nullable=False),
        sa.Column("target_score", sa.Float(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("valid_from", sa.DateTime(), nullable=False),
        sa.Column("valid_until", sa.DateTime(), nullable=True),
        sa.Column("created_by", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["persona_id"], ["personas.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_master_scores_is_active", "master_scores", ["is_active"], unique=False)
    op.create_index("ix_master_scores_persona_id", "master_scores", ["persona_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_master_scores_persona_id", table_name="master_scores")
    op.drop_index("ix_master_scores_is_active", table_name="master_scores")
    op.drop_table("master_scores")
