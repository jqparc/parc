"""Replace average price with realized sell profit on stock master

Revision ID: 20260510_replace_avg_prc_with_slby_prls_amt
Revises: 20260510_add_seq_to_stck_tr_pk
Create Date: 2026-05-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260510_replace_avg_prc_with_slby_prls_amt"
down_revision: Union[str, Sequence[str], None] = "20260510_add_seq_to_stck_tr_pk"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _columns(table_name: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    return {column["name"] for column in inspector.get_columns(table_name)}


def upgrade() -> None:
    columns = _columns("stck_ma")
    if "slby_prls_amt" not in columns:
        op.add_column(
            "stck_ma",
            sa.Column("slby_prls_amt", sa.Numeric(18, 2), nullable=False, server_default="0"),
        )
        with op.batch_alter_table("stck_ma") as batch_op:
            batch_op.alter_column("slby_prls_amt", server_default=None)
    if "avg_prc" in columns:
        with op.batch_alter_table("stck_ma") as batch_op:
            batch_op.drop_column("avg_prc")


def downgrade() -> None:
    columns = _columns("stck_ma")
    if "avg_prc" not in columns:
        op.add_column(
            "stck_ma",
            sa.Column("avg_prc", sa.Numeric(14, 2), nullable=False, server_default="0"),
        )
        op.execute(
            """
            UPDATE stck_ma
            SET avg_prc =
                CASE
                    WHEN (prdy_stcn + incr_stcn - dcrs_stcn) > 0
                    THEN (prdy_acqs_amt + incr_acqs_amt - dcrs_acqs_amt) / (prdy_stcn + incr_stcn - dcrs_stcn)
                    ELSE 0
                END
            """
        )
        with op.batch_alter_table("stck_ma") as batch_op:
            batch_op.alter_column("avg_prc", server_default=None)
    if "slby_prls_amt" in columns:
        with op.batch_alter_table("stck_ma") as batch_op:
            batch_op.drop_column("slby_prls_amt")
