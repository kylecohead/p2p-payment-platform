#!/usr/bin/env python3
"""
Wrapper to run clean_db.py with correct PYTHONPATH so you can call:

  python3 scripts/clean.py --yes

from the `backend` directory.
"""
import os
import sys
import runpy

# Ensure backend dir is on sys.path
HERE = os.path.dirname(__file__)
BACKEND_ROOT = os.path.abspath(os.path.join(HERE, '..'))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

# forward argv (script name doesn't matter for clean_db)
sys.argv = [os.path.join('scripts','clean_db.py')] + sys.argv[1:]

# execute the cleaning script in-process
runpy.run_path(os.path.join(HERE, 'clean_db.py'), run_name='__main__')
