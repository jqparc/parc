"""Create stock item table

Revision ID: 20260510_create_stck_itms
Revises: 20260510_create_stck_ma
Create Date: 2026-05-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260510_create_stck_itms"
down_revision: Union[str, Sequence[str], None] = "20260510_create_stck_ma"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "stck_itms",
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
    op.create_index(op.f("ix_stck_itms_itms_code"), "stck_itms", ["itms_code"], unique=False)

    op.execute(
        """
        INSERT INTO stck_itms (proc_date, itms_code, itms_name, shtg_code, bzty_code)
        SELECT proc_date, itms_code, MIN(itms_name), 'A', NULL
        FROM stck_tr
        WHERE itms_name IS NOT NULL
        GROUP BY proc_date, itms_code
        """
    )

    with op.batch_alter_table("stck_tr") as batch_op:
        batch_op.drop_column("itms_name")


def downgrade() -> None:
    with op.batch_alter_table("stck_tr") as batch_op:
        batch_op.add_column(sa.Column("itms_name", sa.String(length=100), nullable=True))

    op.execute(
        """
        UPDATE stck_tr
        SET itms_name = COALESCE(
            (SELECT stck_itms.itms_name FROM stck_itms WHERE stck_itms.itms_code = stck_tr.itms_code),
            stck_tr.itms_code
        )
        """
    )

    with op.batch_alter_table("stck_tr") as batch_op:
        batch_op.alter_column("itms_name", nullable=False)

    op.drop_index(op.f("ix_stck_itms_itms_code"), table_name="stck_itms")
    op.drop_table("stck_itms")
