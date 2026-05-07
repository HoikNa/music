"""add_submission_validation_checks

Revision ID: p1000001
Revises: b05c0002
Create Date: 2026-05-08 01:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "p1000001"
down_revision: Union[str, None] = "b05c0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "submission_validation_checks",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "submission_id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "check_type",
            sa.Enum("moderation", "plagiarism", "ai_generated", name="validationchecktype"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum("passed", "failed", "skipped", "error", name="validationstatus"),
            nullable=False,
        ),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("reason", sa.String(), nullable=True),
        sa.Column("result", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["submission_id"], ["submissions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_submission_validation_checks_check_type",
        "submission_validation_checks",
        ["check_type"],
        unique=False,
    )
    op.create_index(
        "ix_submission_validation_checks_status",
        "submission_validation_checks",
        ["status"],
        unique=False,
    )
    op.create_index(
        "ix_submission_validation_checks_submission_id",
        "submission_validation_checks",
        ["submission_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_submission_validation_checks_submission_id",
        table_name="submission_validation_checks",
    )
    op.drop_index(
        "ix_submission_validation_checks_status",
        table_name="submission_validation_checks",
    )
    op.drop_index(
        "ix_submission_validation_checks_check_type",
        table_name="submission_validation_checks",
    )
    op.drop_table("submission_validation_checks")
