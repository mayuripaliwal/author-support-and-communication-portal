"""create author, admin, book, ticket, ticket_message sequences

Revision ID: 31fe508ccbb7
Revises: fb9c09d0f364
Create Date: 2026-10-16 17:48:40.067461

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '31fe508ccbb7'
down_revision: Union[str, Sequence[str], None] = 'fb9c09d0f364'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    sequences=["author_id_seq","admin_id_seq","book_id_seq","ticket_id_seq","ticket_message_id_seq"]
    
    for sequence in sequences:
        op.execute(f"CREATE SEQUENCE {sequence} START WITH 1 INCREMENT BY 1"
    )


def downgrade() -> None:
    """Downgrade schema."""
    sequences=["author_id_seq","admin_id_seq","book_id_seq","ticket_id_seq","ticket_message_id_seq"]
    for sequence in sequences:
        op.execute(f"DROP SEQUENCE IF EXISTS {sequence}")
