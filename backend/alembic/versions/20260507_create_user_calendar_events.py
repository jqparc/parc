"""Create user calendar events

Revision ID: 20260507_user_calendar_events
Revises: 20260505_soft_delete_posts
Create Date: 2026-05-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260507_user_calendar_events"
down_revision: Union[str, Sequence[str], None] = "20260505_soft_delete_posts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_calendar_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("start", sa.Date(), nullable=False),
        sa.Column("color", sa.String(length=20), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_calendar_events_id"), "user_calendar_events", ["id"], unique=False)
    op.create_index(
        op.f("ix_user_calendar_events_owner_id"),
        "user_calendar_events",
        ["owner_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_user_calendar_events_start"),
        "user_calendar_events",
        ["start"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_user_calendar_events_start"), table_name="user_calendar_events")
    op.drop_index(op.f("ix_user_calendar_events_owner_id"), table_name="user_calendar_events")
    op.drop_index(op.f("ix_user_calendar_events_id"), table_name="user_calendar_events")
    op.drop_table("user_calendar_events")
