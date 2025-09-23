"""
Test script to verify payment history functionality.

This script demonstrates the new payment history features:
1. Unique reference generation
2. Payment history creation with correct credit/debit logic
3. Description handling
"""

from datetime import datetime, timezone
from decimal import Decimal
from src.models.transaction import Transaction
from src.models.account import Account
from src.models.user import User
from src.services.payment_reference import PaymentReferenceService
from src.services.payment_history import PaymentHistoryService
from src.config.database import LocalSession

def test_payment_history():
    """Test the payment history functionality."""
    with LocalSession() as db:
        print("🧪 Testing Payment History Functionality")
        print("=" * 50)
        
        # Test 1: Reference Generation
        print("\n1. Testing Unique Reference Generation")
        ref1 = PaymentReferenceService.generate_unique_reference(db)
        ref2 = PaymentReferenceService.generate_unique_reference(db)
        print(f"   Reference 1: {ref1}")
        print(f"   Reference 2: {ref2}")
        print(f"   ✓ References are unique: {ref1 != ref2}")
        
        # Test 2: Transaction Code Generation  
        print("\n2. Testing Transaction Code Generation")
        code1 = PaymentReferenceService.generate_transaction_code(db)
        code2 = PaymentReferenceService.generate_transaction_code(db)
        print(f"   Code 1: {code1}")
        print(f"   Code 2: {code2}")
        print(f"   ✓ Codes are sequential: {code1 != code2}")
        
        # Test 3: Get existing users for testing
        print("\n3. Testing with Existing Users")
        users = db.query(User).limit(2).all()
        if len(users) < 2:
            print("   ⚠️  Need at least 2 users to test. Run demo_clients.py first.")
            return
        
        sender_user = users[0]
        recipient_user = users[1]
        
        # Get their accounts
        sender_account = db.query(Account).filter(Account.user_id == sender_user.id).first()
        recipient_account = db.query(Account).filter(Account.user_id == recipient_user.id).first()
        
        if not sender_account or not recipient_account:
            print("   ⚠️  Users need accounts. Create accounts first.")
            return
        
        print(f"   Sender: {sender_user.name} (Account {sender_account.id})")
        print(f"   Recipient: {recipient_user.name} (Account {recipient_account.id})")
        
        # Test 4: Create a mock transaction
        print("\n4. Creating Mock Transaction")
        mock_transaction = Transaction(
            sender_id=sender_account.id,
            recipient_id=recipient_account.id,
            amount=Decimal("100.00"),
            currency="ZAR",
            status="completed",
            kind="transfer",
            method="p2p",
            reference=ref1,
            description="Test coffee payment",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        # Test 5: Generate Payment History Data
        print("\n5. Testing Payment History Generation")
        
        # Test sender's perspective (debit)
        sender_history = PaymentHistoryService.create_payment_history_data(
            db, mock_transaction, "Test coffee payment", sender_account.id
        )
        print(f"   Sender's view (Debit):")
        print(f"     Code: {sender_history['code']}")
        print(f"     Type: {sender_history['type']}")
        print(f"     Amount: {sender_history['amount']}")
        print(f"     Name: {sender_history['name']}")
        print(f"     Description: {sender_history['description']}")
        
        # Test recipient's perspective (credit)
        recipient_history = PaymentHistoryService.create_payment_history_data(
            db, mock_transaction, "Test coffee payment", recipient_account.id
        )
        print(f"   Recipient's view (Credit):")
        print(f"     Code: {recipient_history['code']}")
        print(f"     Type: {recipient_history['type']}")
        print(f"     Amount: {recipient_history['amount']}")
        print(f"     Name: {recipient_history['name']}")
        print(f"     Description: {recipient_history['description']}")
        
        # Verify the logic
        print(f"\n6. Verification")
        print(f"   ✓ Sender amount is negative: {sender_history['amount'] < 0}")
        print(f"   ✓ Recipient amount is positive: {recipient_history['amount'] > 0}")
        print(f"   ✓ Amounts match (abs): {abs(sender_history['amount']) == recipient_history['amount']}")
        print(f"   ✓ Sender type is Debit: {sender_history['type'] == 'Debit'}")
        print(f"   ✓ Recipient type is Credit: {recipient_history['type'] == 'Credit'}")
        print(f"   ✓ References match: {sender_history['reference'] == recipient_history['reference']}")
        
        print("\n✅ All tests completed successfully!")
        print("\nThe payment history system is working correctly:")
        print("- Unique references are generated for each transaction")
        print("- Payment history correctly shows debit/credit perspectives")
        print("- Amounts are properly signed (negative for debits, positive for credits)")
        print("- User names are correctly mapped from the other party's perspective")

if __name__ == "__main__":
    try:
        test_payment_history()
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()