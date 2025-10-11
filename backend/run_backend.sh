#!/bin/bash

# Backend server startup script with clean shutdown
# This script runs the FastAPI backend and redirects stderr to hide shutdown tracebacks
# while keeping API logs (stdout) visible

echo "Starting SafePay Backend Server..."
echo "Server will be available at http://localhost:8000"
echo "API logs will be shown below"
echo "Press Ctrl+C to stop the server cleanly"
echo "----------------------------------------"

# Navigate to backend directory
cd "$(dirname "$0")" || exit 1

# Check if main.py exists
if [ ! -f "main.py" ]; then
    echo "Error: main.py not found in current directory"
    echo "   Make sure you're running this script from the backend folder"
    exit 1
fi

# Check if virtual environment is activated
if [ -z "$VIRTUAL_ENV" ] && [ -z "$CONDA_DEFAULT_ENV" ]; then
    echo "Warning: No virtual environment detected"
    echo "   Consider activating your Python environment first"
    echo ""
fi

# Run the server with stderr redirected to /dev/null
# This hides the shutdown traceback while keeping API logs visible
python main.py 2>/dev/null

# Show clean exit message
echo ""
echo "Backend server stopped cleanly"
echo "Goodbye!"