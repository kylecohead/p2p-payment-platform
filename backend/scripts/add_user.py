#!/usr/bin/env python3
"""Script to add a user directly to the database."""

import sys
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from src.config.database import LocalSession
from src.services.auth import AuthService

def add_user(name: str, email: str, phone: str, password: str, admin: bool = False):
    """Add a new user to the database."""
    db = LocalSession()
    try:
        # Create the user with password
        user = AuthService.create_user_with_password(
            db=db,
            name=name,
            email=email,
            phone=phone,
            password=password,
            admin=admin
        )
        print(f"✓ User created successfully!")
        print(f"  ID: {user.id}")
        print(f"  Name: {user.name}")
        print(f"  Email: {user.email}")
        print(f"  Phone: {user.phone}")
        print(f"  Admin: {user.admin}")
        
    except Exception as e:
        print(f"✗ Error creating user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    
    add_user(
        name="ADMIN",
        email="ADMIN@gmail.com",
        phone="0672555561",
        password="Pass1234",
        admin=True  # Set to True for admin user
    )
