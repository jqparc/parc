"""Create economic news table

Revision ID: 20260507_economic_news
Revises: 20260507_user_calendar_events
Create Date: 2026-05-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260507_economic_news"
down_revision: Union[str, Sequence[str], None] = "20260507_user_calendar_events"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "economic_news",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("source", sa.String(length=120), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("original_url", sa.Text(), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("thumbnail", sa.Text(), nullable=True),
        sa.Column("collected_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("original_url", name="uq_economic_news_original_url"),
    )
    op.create_index(op.f("ix_economic_news_category"), "economic_news", ["category"], unique=False)
    op.create_index(op.f("ix_economic_news_id"), "economic_news", ["id"], unique=False)
    op.create_index(op.f("ix_economic_news_published_at"), "economic_news", ["published_at"], unique=False)
    op.create_index(op.f("ix_economic_news_source"), "economic_news", ["source"], unique=False)
    op.create_index(op.f("ix_economic_news_title"), "economic_news", ["title"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_economic_news_title"), table_name="economic_news")
    op.drop_index(op.f("ix_economic_news_source"), table_name="economic_news")
    op.drop_index(op.f("ix_economic_news_published_at"), table_name="economic_news")
    op.drop_index(op.f("ix_economic_news_id"), table_name="economic_news")
    op.drop_index(op.f("ix_economic_news_category"), table_name="economic_news")
    op.drop_table("economic_news")
