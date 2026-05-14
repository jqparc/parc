"""Create common code table

Revision ID: 20260510_create_cmn_code
Revises: 20260510_redefine_stock_columns
Create Date: 2026-05-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260510_create_cmn_code"
down_revision: Union[str, Sequence[str], None] = "20260510_redefine_stock_columns"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "cmn_code",
        sa.Column("srch_gpcd", sa.String(length=30), nullable=False),
        sa.Column("dtl_code", sa.String(length=30), nullable=False),
        sa.Column("dtl_code_name", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("srch_gpcd", "dtl_code"),
    )


def downgrade() -> None:
    op.drop_table("cmn_code")
