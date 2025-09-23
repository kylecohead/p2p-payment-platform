#!/usr/bin/env python3
"""
Test script to verify balance updates by making actual API calls
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_balance_updates_via_api():
    """Test balance updates through API calls"""
    
    print("=== Testing Balance Updates via API ===")
    
    # Test data - using existing users from our database
    alice_email = "alice@gmail.com"
    alice_password = "password123"  # Assuming default password
    
    bob_email = "bob@gmail.com"
    bob_password = "password123"
    
    try:
        # Step 1: Login as Alice
        print(f"1. Logging in as Alice...")
        alice_login = requests.post(f"{BASE_URL}/api/login", json={
            "email": alice_email,
            "password": alice_password
        })
        
        if alice_login.status_code != 200:
            print(f"   Failed to login as Alice: {alice_login.status_code} - {alice_login.text}")
            return False
            
        alice_data = alice_login.json()
        print(f"   Alice logged in successfully. Initial balance: R{alice_data['balance']}")
        
        # Step 2: Login as Bob  
        print(f"2. Logging in as Bob...")
        bob_login = requests.post(f"{BASE_URL}/api/login", json={
            "email": bob_email,
            "password": bob_password
        })
        
        if bob_login.status_code != 200:
            print(f"   Failed to login as Bob: {bob_login.status_code} - {bob_login.text}")
            return False
            
        bob_data = bob_login.json()
        print(f"   Bob logged in successfully. Initial balance: R{bob_data['balance']}")
        
        # Step 3: Alice sends money to Bob
        send_amount = 25.00
        print(f"3. Alice sending R{send_amount} to Bob...")
        
        send_response = requests.post(f"{BASE_URL}/api/send/{alice_data['id']}", json={
            "amount": send_amount,
            "recipient_email": bob_email,
            "description": "Test payment from Alice to Bob"
        })
        
        if send_response.status_code != 200:
            print(f"   Failed to send money: {send_response.status_code} - {send_response.text}")
            return False
            
        send_result = send_response.json()
        print(f"   Money sent successfully!")
        print(f"   Transaction ID: {send_result.get('transaction_id')}")
        print(f"   Alice's new balance from API response: R{send_result.get('new_balance')}")
        
        # Step 4: Check Alice's balance after sending
        print(f"4. Checking Alice's balance after sending...")
        alice_check = requests.get(f"{BASE_URL}/api/client/{alice_data['id']}")
        
        if alice_check.status_code == 200:
            alice_updated = alice_check.json()
            print(f"   Alice's current balance: R{alice_updated['balance']}")
            expected_alice_balance = alice_data['balance'] - send_amount
            print(f"   Expected Alice balance: R{expected_alice_balance}")
            
            if abs(alice_updated['balance'] - expected_alice_balance) < 0.01:
                print(f"   ✅ Alice's balance updated correctly!")
            else:
                print(f"   ❌ Alice's balance is incorrect!")
        else:
            print(f"   Failed to check Alice's balance: {alice_check.status_code}")
            
        # Step 5: Check Bob's balance after receiving
        print(f"5. Checking Bob's balance after receiving...")
        bob_check = requests.get(f"{BASE_URL}/api/client/{bob_data['id']}")
        
        if bob_check.status_code == 200:
            bob_updated = bob_check.json()
            print(f"   Bob's current balance: R{bob_updated['balance']}")
            expected_bob_balance = bob_data['balance'] + send_amount
            print(f"   Expected Bob balance: R{expected_bob_balance}")
            
            if abs(bob_updated['balance'] - expected_bob_balance) < 0.01:
                print(f"   ✅ Bob's balance updated correctly!")
            else:
                print(f"   ❌ Bob's balance is incorrect!")
        else:
            print(f"   Failed to check Bob's balance: {bob_check.status_code}")
            
        # Step 6: Test Bob sending money back to Alice
        return_amount = 10.00
        print(f"6. Bob sending R{return_amount} back to Alice...")
        
        return_response = requests.post(f"{BASE_URL}/api/send/{bob_data['id']}", json={
            "amount": return_amount,
            "recipient_email": alice_email,
            "description": "Return payment from Bob to Alice"
        })
        
        if return_response.status_code == 200:
            return_result = return_response.json()
            print(f"   Return payment successful!")
            print(f"   Transaction ID: {return_result.get('transaction_id')}")
            print(f"   Bob's new balance from API response: R{return_result.get('new_balance')}")
            
            # Final balance checks
            time.sleep(0.5)  # Small delay to ensure DB is updated
            
            alice_final = requests.get(f"{BASE_URL}/api/client/{alice_data['id']}")
            bob_final = requests.get(f"{BASE_URL}/api/client/{bob_data['id']}")
            
            if alice_final.status_code == 200 and bob_final.status_code == 200:
                alice_final_data = alice_final.json()
                bob_final_data = bob_final.json()
                
                print(f"\n=== Final Balances ===")
                print(f"Alice: R{alice_data['balance']} → R{alice_final_data['balance']} (change: R{alice_final_data['balance'] - alice_data['balance']})")
                print(f"Bob: R{bob_data['balance']} → R{bob_final_data['balance']} (change: R{bob_final_data['balance'] - bob_data['balance']})")
                
                # Expected changes
                expected_alice_change = -send_amount + return_amount
                expected_bob_change = send_amount - return_amount
                
                print(f"\nExpected changes:")
                print(f"Alice: R{expected_alice_change}")
                print(f"Bob: R{expected_bob_change}")
                
                alice_change = alice_final_data['balance'] - alice_data['balance']
                bob_change = bob_final_data['balance'] - bob_data['balance']
                
                if (abs(alice_change - expected_alice_change) < 0.01 and 
                    abs(bob_change - expected_bob_change) < 0.01):
                    print(f"\n✅ All balance updates are working correctly!")
                    return True
                else:
                    print(f"\n❌ Some balance updates are incorrect!")
                    return False
            
        else:
            print(f"   Failed to send return payment: {return_response.status_code} - {return_response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server. Make sure it's running on http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    test_balance_updates_via_api()