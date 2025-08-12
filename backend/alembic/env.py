import sys
import os
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

# access to alembic.ini
config = context.config

#interpret config file
fileConfig(config.config_file_name)

# load .env like int database.py
ROOT_DIRECTORY = Path(__file__).resolve().parents[1]
load_dotenv(ROOT_DIRECTORY / ".env")

SRC_PATH = ROOT_DIRECTORY / "src"
sys.path.insert(0, str(SRC_PATH))

#import models and db
from src.config.database import SPBase, DB_URL, db_engine
from src import models

# set metadata for autogeneration with alembic
target_metadata = SPBase.metadata

config.set_main_option("sqlalchemy.url", DB_URL)

def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = db_engine
    with connectable.connect() as connection:
        context.configure(connection=connection,
                          target_metadata=target_metadata,
                          compare_type=True)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
