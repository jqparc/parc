"""Restore stck_itms table name

Revision ID: 20260514_restore_stck_itms_table
Revises: 20260514_rename_plural_table_to_singular
Create Date: 2026-05-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260514_restore_stck_itms_table"
down_revision: Union[str, Sequence[str], None] = "20260514_rename_plural_table_to_singular"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_names() -> set[str]:
    return set(sa.inspect(op.get_bind()).get_table_names())


def _rename_existing_table(source_name: str, target_name: str) -> None:
    table_names = _table_names()
    if source_name in table_names and target_name not in table_names:
        op.rename_table(source_name, target_name)
    elif source_name in table_names and target_name in table_names:
        source_count = op.get_bind().execute(sa.text(f"SELECT COUNT(*) FROM {source_name}")).scalar_one()
        target_count = op.get_bind().execute(sa.text(f"SELECT COUNT(*) FROM {target_name}")).scalar_one()
        if source_count and not target_count:
            op.execute(sa.text(f"INSERT INTO {target_name} SELECT * FROM {source_name}"))


def upgrade() -> None:
    _rename_existing_table("stck_itm", "stck_itms")


def downgrade() -> None:
    _rename_existing_table("stck_itms", "stck_itm")
