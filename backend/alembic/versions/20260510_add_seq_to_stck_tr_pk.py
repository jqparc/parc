"""Add sequence to stock trade primary key

Revision ID: 20260510_add_seq_to_stck_tr_pk
Revises: 20260510_redefine_stock_columns
Create Date: 2026-05-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260510_add_seq_to_stck_tr_pk"
down_revision: Union[str, Sequence[str], None] = "20260510_redefine_stock_columns"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _columns(table_name: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    return {column["name"] for column in inspector.get_columns(table_name)}


def upgrade() -> None:
    if "seq" in _columns("stck_tr"):
        return

    op.create_table(
        "stck_tr_new",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("proc_date", sa.Date(), nullable=False),
        sa.Column("itms_code", sa.String(length=20), nullable=False),
        sa.Column("trns_code", sa.String(length=1), nullable=False),
        sa.Column("seq", sa.Integer(), nullable=False),
        sa.Column("qnty", sa.Integer(), nullable=False),
        sa.Column("prc", sa.Numeric(14, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("user_id", "proc_date", "itms_code", "trns_code", "seq"),
    )
    op.execute(
        """
        INSERT INTO stck_tr_new (
            user_id, proc_date, itms_code, trns_code, seq, qnty, prc, created_at, updated_at
        )
        SELECT user_id, proc_date, itms_code, trns_code, 1, qnty, prc, created_at, updated_at
        FROM stck_tr
        """
    )
    op.drop_table("stck_tr")
    op.rename_table("stck_tr_new", "stck_tr")
    op.create_index(op.f("ix_stck_tr_user_id"), "stck_tr", ["user_id"], unique=False)
    op.create_index(op.f("ix_stck_tr_itms_code"), "stck_tr", ["itms_code"], unique=False)


def downgrade() -> None:
    if "seq" not in _columns("stck_tr"):
        return

    op.create_table(
        "stck_tr_old",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("proc_date", sa.Date(), nullable=False),
        sa.Column("itms_code", sa.String(length=20), nullable=False),
        sa.Column("trns_code", sa.String(length=1), nullable=False),
        sa.Column("qnty", sa.Integer(), nullable=False),
        sa.Column("prc", sa.Numeric(14, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("user_id", "proc_date", "itms_code", "trns_code"),
    )
    op.execute(
        """
        INSERT INTO stck_tr_old (user_id, proc_date, itms_code, trns_code, qnty, prc, created_at, updated_at)
        SELECT user_id, proc_date, itms_code, trns_code, SUM(qnty), SUM(qnty * prc) / SUM(qnty), MIN(created_at), MAX(updated_at)
        FROM stck_tr
        GROUP BY user_id, proc_date, itms_code, trns_code
        """
    )
    op.drop_table("stck_tr")
    op.rename_table("stck_tr_old", "stck_tr")
    op.create_index(op.f("ix_stck_tr_user_id"), "stck_tr", ["user_id"], unique=False)
    op.create_index(op.f("ix_stck_tr_itms_code"), "stck_tr", ["itms_code"], unique=False)
