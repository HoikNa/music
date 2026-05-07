"""add_generated_assets

Revision ID: p2000001
Revises: p1000001
Create Date: 2026-05-08 02:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "p2000001"
down_revision: Union[str, None] = "p1000001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "generated_assets",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column(
            "asset_type",
            sa.Enum("lyrics", "composition", "mastering", name="generatedassettype"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum("queued", "running", "succeeded", "failed", "skipped", name="generatedassetstatus"),
            nullable=False,
        ),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("model", sa.String(length=100), nullable=True),
        sa.Column("prompt", sa.String(), nullable=True),
        sa.Column("input_data", sa.JSON(), nullable=True),
        sa.Column("output_text", sa.String(), nullable=True),
        sa.Column("output_url", sa.String(length=512), nullable=True),
        sa.Column("source_submission_id", sa.Uuid(), nullable=True),
        sa.Column("error_message", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["source_submission_id"], ["submissions.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_generated_assets_asset_type", "generated_assets", ["asset_type"], unique=False)
    op.create_index("ix_generated_assets_status", "generated_assets", ["status"], unique=False)
    op.create_index("ix_generated_assets_user_id", "generated_assets", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_generated_assets_user_id", table_name="generated_assets")
    op.drop_index("ix_generated_assets_status", table_name="generated_assets")
    op.drop_index("ix_generated_assets_asset_type", table_name="generated_assets")
    op.drop_table("generated_assets")
