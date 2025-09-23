from dotenv import load_dotenv
import os
import sys
import argparse
from sqlalchemy import text

SCRIPT_DIR = os.path.dirname(__file__)
ENV_PATH = os.path.join(SCRIPT_DIR, '..', '.env')
if not os.path.exists(ENV_PATH):
  ENV_PATH = os.path.join(SCRIPT_DIR, '..', '..', '.env')
load_dotenv(ENV_PATH)

DB_URL = os.getenv('DATABASE_URL')
if not DB_URL:
  print('DATABASE_URL not found in .env. Aborting.')
  sys.exit(2)

parser = argparse.ArgumentParser(description='Truncate all tables in public schema (restart identities).')
parser.add_argument('-y', '--yes', action='store_true', help='Skip confirmation prompt')
args = parser.parse_args()

def get_confirmation():
  if args.yes:
    return True
    #to abort just type anytihing and enter
  confirm = input("Delete Records? Type YES to continue: ")
  return confirm.strip().upper() == 'YES'

if not get_confirmation():
  print('Aborted by user.')
  sys.exit(0)

try:

    from src.config.database import db_engine
except Exception as e:
    sys.exit(3)

with db_engine.connect() as conn:
    sql = text(r"""
    DO $$ DECLARE r RECORD; BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname='public') LOOP
        EXECUTE format('TRUNCATE TABLE public.%I RESTART IDENTITY CASCADE', r.tablename);
      END LOOP;
    END $$;
    """)
    conn.execute(sql)
    conn.commit()

print('Schemas Clean. DB Reset Complete.')
