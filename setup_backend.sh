#!/bin/bash

# Setup script for Waluigi backend

echo "Setting up Waluigi Backend..."

# Navigate to backend directory
cd backend

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Seed the database with demo data
echo "Seeding database with demo data..."
python -m scripts.seeds.demo_clients

echo "Setup complete!"
echo ""
echo "To start the backend server:"
echo "cd backend && python main.py"
echo ""
echo "Demo users for testing:"
echo "- alice@gmail.com (Balance: $0.00)"
echo "- bob@gmail.com (Balance: $25.50)"
echo "- carol@gmail.com (Balance: $100.00)"
