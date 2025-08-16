"""enforced lengths on strings fixed

Revision ID: 2d0db0b9ee9d
Revises: 43a5266090b0
Create Date: 2025-08-16 09:11:18.214948

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2d0db0b9ee9d'
down_revision: Union[str, Sequence[str], None] = '43a5266090b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "clients",
        "name",
        existing_type=sa.String(),        
        type_=sa.String(120),            
        existing_nullable=False,
    )
    op.alter_column(
        "clients",
        "email",
        existing_type=sa.String(),
        type_=sa.String(255),
        existing_nullable=False,
    )
    op.alter_column(
        "clients",
        "phone",
        existing_type=sa.String(),
        type_=sa.String(50),
        existing_nullable=False,
    )



def downgrade() -> None:
    op.alter_column(
        "clients",
        "name",
        existing_type=sa.String(120),
        type_=sa.String(),
        existing_nullable=False,
    )
    op.alter_column(
        "clients",
        "email",
        existing_type=sa.String(255),
        type_=sa.String(),
        existing_nullable=False,
    )
    op.alter_column(
        "clients",
        "phone",
        existing_type=sa.String(50),
        type_=sa.String(),
        existing_nullable=False,
    )
