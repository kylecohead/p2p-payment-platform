import os
import sys
import runpy
import argparse

HERE = os.path.dirname(__file__)
BACKEND_ROOT = os.path.abspath(os.path.join(HERE, '..'))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

parser = argparse.ArgumentParser()
parser.add_argument('-y', '--yes', action='store_true', help='Skip confirmation on clean step')
args, extra = parser.parse_known_args()

# Run cleaner
clean_argv = ['scripts/clean_db.py']
if args.yes:
    clean_argv.append('--yes')
sys.argv = clean_argv + extra
print('Running DB clean...')
runpy.run_path(os.path.join(HERE, 'clean_db.py'), run_name='__main__')

print('\nRunning demo seed...')
sys.argv = ['scripts/seeds/demo_clients.py']
runpy.run_path(os.path.join(HERE, 'seeds', 'demo_clients.py'), run_name='__main__')

print('\nReset and seed complete.')
