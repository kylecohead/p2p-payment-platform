import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from pathlib import Path
from sqlalchemy.orm import sessionmaker, declarative_base

#finding db url in .env file
ROOT_DIRECTORY = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIRECTORY / ".env")

DB_URL = os.getenv("DATABASE_URL")

if not (DB_URL) : 
    raise RuntimeError("no set DATABASE_URL in .env file")

#database engine, pool_pre_ping used to avoid stale connection
db_engine = create_engine(DB_URL, pool_pre_ping=True)
LocalSession = sessionmaker(autoflush=False, autocommit=False, bind=db_engine)

#Base model for models in model.py (Alembic)
SPBase = declarative_base()

def get_db(): 
    db = LocalSession()
    try:
        yield db
    finally:
        db.close()