"""Create stock master table

Revision ID: 20260510_create_stck_ma
Revises: 20260509_domestic_stock_trades
Create Date: 2026-05-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260510_create_stck_ma"
down_revision: Union[str, Sequence[str], None] = "20260509_domestic_stock_trades"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "stck_ma",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("proc_date", sa.Date(), nullable=False),
        sa.Column("itms_code", sa.String(length=20), nullable=False),
        sa.Column("shtg_code", sa.String(length=1), nullable=False, server_default="A"),
        sa.Column("bzty_code", sa.String(length=3), nullable=True),
        sa.Column("prdy_stcn", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("incr_stcn", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("dcrs_stcn", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("prdy_acqs_amt", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("incr_acqs_amt", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("dcrs_acqs_amt", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("prls_amt", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("vlamt", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("slby_prls_amt", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("user_id", "proc_date", "itms_code"),
    )
    op.create_index(op.f("ix_stck_ma_itms_code"), "stck_ma", ["itms_code"], unique=False)
    op.create_index(op.f("ix_stck_ma_proc_date"), "stck_ma", ["proc_date"], unique=False)
    op.create_index(op.f("ix_stck_ma_user_id"), "stck_ma", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_stck_ma_user_id"), table_name="stck_ma")
    op.drop_index(op.f("ix_stck_ma_proc_date"), table_name="stck_ma")
    op.drop_index(op.f("ix_stck_ma_itms_code"), table_name="stck_ma")
    op.drop_table("stck_ma")
