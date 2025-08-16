"""updated client constraints

Revision ID: 8cbc07ba6273
Revises: f9bbb11bd00d
Create Date: 2025-08-12 19:13:17.768482

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '8cbc07ba6273'
down_revision: Union[str, Sequence[str], None] = 'f9bbb11bd00d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Upgrade schema."""
    # Drop unnamed unique constraints created by column unique=True (Postgres naming)
    op.execute("ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_email_key")
    op.execute("ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_phone_key")

    # Create named unique constraints
    op.create_unique_constraint('uq_clients_email', 'clients', ['email'])
    op.create_unique_constraint('uq_clients_phone', 'clients', ['phone'])

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('uq_clients_phone', 'clients', type_='unique')
    op.drop_constraint('uq_clients_email', 'clients', type_='unique')

    # Restore unnamed unique constraints (Postgres)
    op.execute("ALTER TABLE clients ADD CONSTRAINT clients_email_key UNIQUE (email)")
    op.execute("ALTER TABLE clients ADD CONSTRAINT clients_phone_key UNIQUE (phone)")
