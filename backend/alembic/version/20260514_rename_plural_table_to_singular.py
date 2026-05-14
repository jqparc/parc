"""Rename plural table names to singular

Revision ID: 20260514_rename_plural_table_to_singular
Revises: 20260510_replace_avg_prc_with_slby_prls_amt
Create Date: 2026-05-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260514_rename_plural_table_to_singular"
down_revision: Union[str, Sequence[str], None] = "20260510_replace_avg_prc_with_slby_prls_amt"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLE_RENAMES = (
    ("users", "user"),
    ("menus", "menu"),
    ("tabs", "tab"),
    ("boards", "board"),
    ("posts", "post"),
    ("user_calendar_events", "user_calendar_event"),
    ("stck_itms", "stck_itm"),
)


def _table_names() -> set[str]:
    return set(sa.inspect(op.get_bind()).get_table_names())


def _rename_existing_tables(pairs: tuple[tuple[str, str], ...]) -> None:
    table_names = _table_names()
    for old_name, new_name in pairs:
        if old_name in table_names and new_name not in table_names:
            op.rename_table(old_name, new_name)
            table_names.remove(old_name)
            table_names.add(new_name)


def upgrade() -> None:
    _rename_existing_tables(TABLE_RENAMES)


def downgrade() -> None:
    _rename_existing_tables(tuple((new_name, old_name) for old_name, new_name in reversed(TABLE_RENAMES)))
