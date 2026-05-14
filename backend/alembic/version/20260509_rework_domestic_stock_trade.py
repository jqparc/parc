"""Rework domestic stock trades columns

Revision ID: 20260509_domestic_stock_trades
Revises: 20260507_economic_news
Create Date: 2026-05-09

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260509_domestic_stock_trades"
down_revision: Union[str, Sequence[str], None] = "20260507_economic_news"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.rename_table("domestic_stock_holdings", "stck_tr")

    with op.batch_alter_table("stck_tr") as batch_op:
        batch_op.alter_column("owner_id", new_column_name="user_id")
        batch_op.alter_column("purchase_date", new_column_name="proc_date")
        batch_op.alter_column("stock_code", new_column_name="itms_code")
        batch_op.alter_column("stock_name", new_column_name="itms_name")
        batch_op.alter_column("quantity", new_column_name="qnty")
        batch_op.alter_column("purchase_price", new_column_name="prc")
        batch_op.add_column(sa.Column("trns_code", sa.String(length=1), nullable=False, server_default="B"))
        batch_op.drop_column("market")
        batch_op.drop_column("current_price")
        batch_op.drop_column("memo")

    with op.batch_alter_table("stck_tr") as batch_op:
        batch_op.alter_column("trns_code", server_default=None)

    op.create_table(
        "stck_tr_new",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("proc_date", sa.Date(), nullable=False),
        sa.Column("itms_code", sa.String(length=20), nullable=False),
        sa.Column("itms_name", sa.String(length=100), nullable=False),
        sa.Column("trns_code", sa.String(length=1), nullable=False),
        sa.Column("qnty", sa.Integer(), nullable=False),
        sa.Column("prc", sa.Numeric(14, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("user_id", "proc_date", "itms_code", "trns_code"),
    )
    op.execute(
        """
        INSERT INTO stck_tr_new (user_id, proc_date, itms_code, itms_name, trns_code, qnty, prc, created_at, updated_at)
        SELECT user_id, proc_date, itms_code, MIN(itms_name), trns_code, SUM(qnty), SUM(qnty * prc) / SUM(qnty), MIN(created_at), MAX(updated_at)
        FROM stck_tr
        GROUP BY user_id, proc_date, itms_code, trns_code
        """
    )
    op.drop_table("stck_tr")
    op.rename_table("stck_tr_new", "stck_tr")
    op.create_index(op.f("ix_stck_tr_user_id"), "stck_tr", ["user_id"], unique=False)
    op.create_index(op.f("ix_stck_tr_itms_code"), "stck_tr", ["itms_code"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("stck_tr") as batch_op:
        batch_op.add_column(sa.Column("memo", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("current_price", sa.Numeric(14, 2), nullable=True))
        batch_op.add_column(sa.Column("market", sa.String(length=20), nullable=True, server_default="KOSPI"))
        batch_op.drop_column("trns_code")
        batch_op.alter_column("prc", new_column_name="purchase_price")
        batch_op.alter_column("qnty", new_column_name="quantity")
        batch_op.alter_column("itms_name", new_column_name="stock_name")
        batch_op.alter_column("itms_code", new_column_name="stock_code")
        batch_op.alter_column("proc_date", new_column_name="purchase_date")
        batch_op.alter_column("user_id", new_column_name="owner_id")

    op.rename_table("stck_tr", "domestic_stock_holdings")
