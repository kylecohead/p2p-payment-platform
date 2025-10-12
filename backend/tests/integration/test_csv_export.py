#!/usr/bin/env python3
# Test script for CSV export functionality
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import requests
import json

BASE_URL = "http://localhost:8000"

def test_csv_export():
    # Test CSV export functionality for admin users
    
    print("=== Testing CSV Export Functionality ===")
    
    # First, login as an admin user (assuming alice is admin for testing)
    admin_email = "admin@example.local" 
    admin_password = "AdminPass1$"
    
    try:
        # Step 1: Login as admin
        print("1. Logging in as admin...")
        login_response = requests.post(f"{BASE_URL}/api/login", json={
            "email": admin_email,
            "password": admin_password
        })
        
        if login_response.status_code != 200:
            print(f"   Login failed: {login_response.status_code} - {login_response.text}")
            return
            
        admin_data = login_response.json()
        admin_id = admin_data['id']
        is_admin = admin_data.get('admin', False)
        
        print(f"   Admin logged in successfully. ID: {admin_id}, Admin: {is_admin}")
        
        if not is_admin:
            print("   Warning: User is not marked as admin in database")
        
        # Step 2: Test flagged payments export
        print("2. Testing flagged payments CSV export...")
        export_response = requests.get(
            f"{BASE_URL}/api/admin/export-flagged-payments",
            params={"user_id": admin_id, "include_cleared": False}
        )
        
        if export_response.status_code == 200:
            print(f"   ✓ Flagged payments CSV export successful")
            print(f"   Content-Type: {export_response.headers.get('content-type')}")
            print(f"   Content-Disposition: {export_response.headers.get('content-disposition')}")
            
            # Show first few lines of CSV
            csv_lines = export_response.text.split('\n')[:5]
            print(f"   CSV Preview (first 5 lines):")
            for i, line in enumerate(csv_lines):
                print(f"     {i+1}: {line[:100]}{'...' if len(line) > 100 else ''}")
        else:
            print(f"   ✗ Flagged payments CSV export failed: {export_response.status_code}")
            print(f"   Response: {export_response.text}")
            
        # Step 3: Test active blocks export  
        print("3. Testing active blocks CSV export...")
        blocks_response = requests.get(
            f"{BASE_URL}/api/admin/export-active-blocks",
            params={"user_id": admin_id}
        )
        
        if blocks_response.status_code == 200:
            print(f"   ✓ Active blocks CSV export successful")
            print(f"   Content-Type: {blocks_response.headers.get('content-type')}")
            
            # Show first few lines of CSV
            csv_lines = blocks_response.text.split('\n')[:5]  
            print(f"   CSV Preview (first 5 lines):")
            for i, line in enumerate(csv_lines):
                print(f"     {i+1}: {line[:100]}{'...' if len(line) > 100 else ''}")
        else:
            print(f"   ✗ Active blocks CSV export failed: {blocks_response.status_code}")
            print(f"   Response: {blocks_response.text}")
            
        # Step 4: Test non-admin access (should fail)
        print("4. Testing non-admin access (should fail)...")
        non_admin_response = requests.get(
            f"{BASE_URL}/api/admin/export-flagged-payments", 
            params={"user_id": 999, "include_cleared": False}  # Non-existent user
        )
        
        if non_admin_response.status_code == 403:
            print("Non-admin access properly blocked")
        else:
            print(f"Expected 403, got {non_admin_response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("Connection failed - is the backend server running?")
        print("Try running: cd backend && python main.py")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    test_csv_export()