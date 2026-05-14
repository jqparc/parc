"""Redefine stock column names for trade, item, and master logic

Revision ID: 20260510_redefine_stock_columns
Revises: 20260510_create_stck_itm
Create Date: 2026-05-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260510_redefine_stock_columns"
down_revision: Union[str, Sequence[str], None] = "20260510_create_stck_itm"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _columns(table_name: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    return {column["name"] for column in inspector.get_columns(table_name)}


def _add_column_if_missing(table_name: str, column_name: str, column: sa.Column) -> None:
    if column_name not in _columns(table_name):
        op.add_column(table_name, column)


def _drop_column_if_exists(table_name: str, column_name: str) -> None:
    if column_name in _columns(table_name):
        with op.batch_alter_table(table_name) as batch_op:
            batch_op.drop_column(column_name)


def upgrade() -> None:
    trade_columns = _columns("stck_tr")
    if "prcn" in trade_columns and "prc" not in trade_columns:
        with op.batch_alter_table("stck_tr") as batch_op:
            batch_op.alter_column("prcn", new_column_name="prc")
    _drop_column_if_exists("stck_tr", "shtg_code")
    _drop_column_if_exists("stck_tr", "bzty_code")
    if "id" in _columns("stck_tr"):
        op.create_table(
            "stck_tr_new",
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("proc_date", sa.Date(), nullable=False),
            sa.Column("itms_code", sa.String(length=20), nullable=False),
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
            INSERT INTO stck_tr_new (user_id, proc_date, itms_code, trns_code, qnty, prc, created_at, updated_at)
            SELECT user_id, proc_date, itms_code, trns_code, SUM(qnty), SUM(qnty * prc) / SUM(qnty), MIN(created_at), MAX(updated_at)
            FROM stck_tr
            GROUP BY user_id, proc_date, itms_code, trns_code
            """
        )
        op.drop_table("stck_tr")
        op.rename_table("stck_tr_new", "stck_tr")
        op.create_index(op.f("ix_stck_tr_user_id"), "stck_tr", ["user_id"], unique=False)
        op.create_index(op.f("ix_stck_tr_itms_code"), "stck_tr", ["itms_code"], unique=False)

    item_columns = _columns("stck_itms")
    if "prc" in item_columns and "clpr" not in item_columns:
        with op.batch_alter_table("stck_itms") as batch_op:
            batch_op.alter_column("prc", new_column_name="clpr")
    _drop_column_if_exists("stck_itms", "last_sync_at")
    if "id" in _columns("stck_itms"):
        op.create_table(
            "stck_itms_new",
            sa.Column("proc_date", sa.Date(), nullable=False),
            sa.Column("itms_code", sa.String(length=20), nullable=False),
            sa.Column("itms_name", sa.String(length=100), nullable=False),
            sa.Column("shtg_code", sa.String(length=1), nullable=False, server_default="A"),
            sa.Column("bzty_code", sa.String(length=3), nullable=True),
            sa.Column("clpr", sa.Numeric(14, 2), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.PrimaryKeyConstraint("proc_date", "itms_code"),
        )
        op.execute(
            """
            INSERT INTO stck_itms_new (proc_date, itms_code, itms_name, shtg_code, bzty_code, clpr, created_at, updated_at)
            SELECT
                COALESCE(proc_date, DATE(created_at), DATE('now')),
                itms_code,
                MIN(itms_name),
                COALESCE(MIN(shtg_code), 'A'),
                MIN(CASE WHEN bzty_code GLOB '[0-9][0-9][0-9]' THEN bzty_code END),
                MAX(clpr),
                MIN(created_at),
                MAX(updated_at)
            FROM stck_itms
            GROUP BY COALESCE(proc_date, DATE(created_at), DATE('now')), itms_code
            """
        )
        op.drop_table("stck_itms")
        op.rename_table("stck_itms_new", "stck_itms")
        op.create_index(op.f("ix_stck_itms_itms_code"), "stck_itms", ["itms_code"], unique=False)

    master_columns = _columns("stck_ma")
    rename_pairs = [
        ("prdy_vlamt", "prdy_acqs_amt"),
        ("incr_vlamt", "incr_acqs_amt"),
        ("dcrs_vlamt", "dcrs_acqs_amt"),
    ]
    for old_name, new_name in rename_pairs:
        if old_name in master_columns and new_name not in master_columns:
            with op.batch_alter_table("stck_ma") as batch_op:
                batch_op.alter_column(old_name, new_column_name=new_name)
            master_columns.remove(old_name)
            master_columns.add(new_name)

    master_columns = _columns("stck_ma")
    if "id" in master_columns or any(
        column_name in master_columns
        for column_name in ("acqs_amt", "hold_stcn", "avg_acqs_prc", "clpr", "prls_rate")
    ):
        op.create_table(
            "stck_ma_new",
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
            sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
            sa.PrimaryKeyConstraint("user_id", "proc_date", "itms_code"),
        )
        op.execute(
            """
            INSERT INTO stck_ma_new (
                user_id, proc_date, itms_code, shtg_code, bzty_code,
                prdy_stcn, incr_stcn, dcrs_stcn,
                prdy_acqs_amt, incr_acqs_amt, dcrs_acqs_amt,
                prls_amt, vlamt, slby_prls_amt, created_at, updated_at
            )
            SELECT
                user_id, proc_date, itms_code, COALESCE(shtg_code, 'A'), bzty_code,
                prdy_stcn, incr_stcn, dcrs_stcn,
                prdy_acqs_amt, incr_acqs_amt, dcrs_acqs_amt,
                prls_amt, vlamt, 0, MIN(created_at), MAX(updated_at)
            FROM stck_ma
            GROUP BY user_id, proc_date, itms_code
            """
        )
        op.drop_table("stck_ma")
        op.rename_table("stck_ma_new", "stck_ma")
        op.create_index(op.f("ix_stck_ma_user_id"), "stck_ma", ["user_id"], unique=False)
        op.create_index(op.f("ix_stck_ma_proc_date"), "stck_ma", ["proc_date"], unique=False)
        op.create_index(op.f("ix_stck_ma_itms_code"), "stck_ma", ["itms_code"], unique=False)


def downgrade() -> None:
    trade_columns = _columns("stck_tr")
    if "prc" in trade_columns and "prcn" not in trade_columns:
        with op.batch_alter_table("stck_tr") as batch_op:
            batch_op.alter_column("prc", new_column_name="prcn")

    item_columns = _columns("stck_itms")
    if "clpr" in item_columns and "prc" not in item_columns:
        with op.batch_alter_table("stck_itms") as batch_op:
            batch_op.alter_column("clpr", new_column_name="prc")

    master_columns = _columns("stck_ma")
    for column_name in ("prls_rate", "clpr", "avg_acqs_prc"):
        if column_name in master_columns:
            with op.batch_alter_table("stck_ma") as batch_op:
                batch_op.drop_column(column_name)
            master_columns.remove(column_name)

    rename_pairs = [
        ("dcrs_acqs_amt", "dcrs_vlamt"),
        ("incr_acqs_amt", "incr_vlamt"),
        ("prdy_acqs_amt", "prdy_vlamt"),
    ]
    for old_name, new_name in rename_pairs:
        if old_name in master_columns and new_name not in master_columns:
            with op.batch_alter_table("stck_ma") as batch_op:
                batch_op.alter_column(old_name, new_column_name=new_name)
            master_columns.remove(old_name)
            master_columns.add(new_name)
