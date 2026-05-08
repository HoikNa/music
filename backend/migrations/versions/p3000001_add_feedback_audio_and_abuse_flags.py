"""add_feedback_audio_and_abuse_flags

Revision ID: p3000001
Revises: p2000001
Create Date: 2026-05-08 01:45:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "p3000001"
down_revision: Union[str, None] = "p2000001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("feedbacks") as batch_op:
        batch_op.add_column(sa.Column("audio_url", sa.String(length=512), nullable=True))
        batch_op.add_column(sa.Column("audio_status", sa.String(length=20), nullable=False, server_default="queued"))
        batch_op.add_column(sa.Column("audio_model", sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column("audio_error", sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column("audio_generated_at", sa.DateTime(), nullable=True))

    with op.batch_alter_table("submissions") as batch_op:
        batch_op.add_column(sa.Column("is_ranking_excluded", sa.Boolean(), nullable=False, server_default=sa.false()))
        batch_op.add_column(sa.Column("abuse_risk_score", sa.Float(), nullable=False, server_default="0"))
        batch_op.add_column(sa.Column("abuse_flags", sa.JSON(), nullable=True))
        batch_op.create_index("ix_submissions_is_ranking_excluded", ["is_ranking_excluded"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("submissions") as batch_op:
        batch_op.drop_index("ix_submissions_is_ranking_excluded")
        batch_op.drop_column("abuse_flags")
        batch_op.drop_column("abuse_risk_score")
        batch_op.drop_column("is_ranking_excluded")

    with op.batch_alter_table("feedbacks") as batch_op:
        batch_op.drop_column("audio_generated_at")
        batch_op.drop_column("audio_error")
        batch_op.drop_column("audio_model")
        batch_op.drop_column("audio_status")
        batch_op.drop_column("audio_url")
