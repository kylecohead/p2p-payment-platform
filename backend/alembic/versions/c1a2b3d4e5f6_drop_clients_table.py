"""drop clients table

Revision ID: c1a2b3d4e5f6
Revises: 9d70210d2bd2
Create Date: 2025-09-08 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1a2b3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '9d70210d2bd2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: drop the legacy clients table.

    Note: do not drop this table until all services have migrated off it.
    """
    # Alembic's op.drop_table will error if the table doesn't exist in some DBs;
    # running this against a DB where `clients` is already gone will raise. Run
    # in a controlled environment or wrap in a guard if needed.
    op.drop_table('clients')


def downgrade() -> None:
    """Downgrade schema: recreate the legacy clients table.

    The schema here matches the original `create clients table` migration so a
    downgrade will restore the table shape for older branches.
    """
    op.create_table(
        'clients',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('phone', sa.String(), nullable=False, unique=True),
        sa.Column('balance', sa.Numeric(12, 2), server_default=sa.text('0'), nullable=False),
    )
