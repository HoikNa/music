"""add_master_score_id_to_tournament_tickets

Revision ID: b05c0002
Revises: b05c0001
Create Date: 2026-05-08 00:01:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b05c0002"
down_revision: Union[str, None] = "b05c0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("tournament_tickets")}
    indexes = {index["name"] for index in inspector.get_indexes("tournament_tickets")}

    with op.batch_alter_table("tournament_tickets") as batch_op:
        if "master_score_id" not in columns:
            batch_op.add_column(sa.Column("master_score_id", sa.Uuid(), nullable=True))
        batch_op.create_foreign_key(
            "fk_tournament_tickets_master_score_id_master_scores",
            "master_scores",
            ["master_score_id"],
            ["id"],
        )
        if "ix_tournament_tickets_master_score_id" not in indexes:
            batch_op.create_index(
                "ix_tournament_tickets_master_score_id",
                ["master_score_id"],
                unique=False,
            )


def downgrade() -> None:
    with op.batch_alter_table("tournament_tickets") as batch_op:
        batch_op.drop_index("ix_tournament_tickets_master_score_id")
        batch_op.drop_constraint(
            "fk_tournament_tickets_master_score_id_master_scores",
            type_="foreignkey",
        )
        batch_op.drop_column("master_score_id")
