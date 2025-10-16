"""
Tests for the PaymentHistoryService.
"""
from datetime import datetime, timezone
from decimal import Decimal
import pytest
from src.services.payment_history import PaymentHistoryService
from src.models.transaction import Transaction
from src.models.account import Account
from src.models.user import User


# Mock database session
class DBStub:
    """Stub database session for testing."""
    
    def __init__(self):
        self.data = {}
        self.added = []
        self.committed = False
    
    def query(self, model):
        return QueryStub(self, model)
    
    def add(self, obj):
        self.added.append(obj)
    
    def commit(self):
        self.committed = True


class QueryStub:
    """Stub query builder."""
    
    def __init__(self, db, model):
        self.db = db
        self.model = model
        self._filter_id = None
    
    def filter(self, *args, **kwargs):
        # Simple ID extraction - in real scenario, parse SQLAlchemy expression
        # For testing, we'll use a convention
        return self
    
    def first(self):
        # Return data based on model and stored test data
        model_name = self.model.__name__
        return self.db.data.get(model_name)


def create_test_user(user_id: int, name: str, email: str) -> User:
    """Helper to create a test user."""
    # Create a mock User-like object
    class MockUser:
        def __init__(self, id, name, email, phone):
            self.id = id
            self.name = name
            self.email = email
            self.phone = phone
    
    return MockUser(id=user_id, name=name, email=email, phone="1234567890")


def create_test_account(account_id: int, user_id: int, balance: Decimal = Decimal("1000.00")) -> Account:
    """Helper to create a test account."""
    # Create a mock Account-like object without using the real SQLAlchemy model
    class MockAccount:
        def __init__(self, id, user_id, account_number, balance, payment_history):
            self.id = id
            self.user_id = user_id
            self.account_number = account_number
            self.balance = balance
            self.payment_history = payment_history
    
    return MockAccount(
        id=account_id,
        user_id=user_id,
        account_number=f"ACC{account_id:06d}",
        balance=balance,
        payment_history=[]
    )


def create_test_transaction(
    txn_id: int,
    sender_id: int,
    recipient_id: int,
    amount: Decimal,
    reference: str = "TEST001"
) -> Transaction:
    """Helper to create a test transaction."""
    # Create a mock Transaction-like object
    class MockTransaction:
        def __init__(self, id, sender_id, recipient_id, amount, reference, status, method, created_at):
            self.id = id
            self.sender_id = sender_id
            self.recipient_id = recipient_id
            self.amount = amount
            self.reference = reference
            self.status = status
            self.method = method
            self.created_at = created_at
    
    return MockTransaction(
        id=txn_id,
        sender_id=sender_id,
        recipient_id=recipient_id,
        amount=amount,
        reference=reference,
        status="completed",
        method="transfer",
        created_at=datetime(2024, 1, 15, 14, 30, 0)
    )

# Tests for update_transaction_payment_history
def test_update_transaction_payment_history():
    """Test updating transaction with payment history for both accounts."""
    db = DBStub()
    
    sender_user = create_test_user(1, "Alice", "alice@example.com")
    recipient_user = create_test_user(2, "Bob", "bob@example.com")
    sender_account = create_test_account(10, 1)
    recipient_account = create_test_account(20, 2)
    transaction = create_test_transaction(100, 10, 20, Decimal("500.00"))
    
    call_sequence = []
    
    class CustomQueryStub:
        def filter(self, *args):
            return self
        
        def first(self):
            call = len(call_sequence)
            call_sequence.append(call)
            
            # Pattern: perspective, sender, recipient, sender_user, recipient_user (repeat 2x), then accounts again
            if call in [0, 5]:  # perspective account (sender)
                return sender_account
            elif call in [1, 6]:  # sender account
                return sender_account
            elif call in [2, 7]:  # recipient account
                return recipient_account
            elif call in [3, 8]:  # sender user
                return sender_user
            elif call in [4, 9]:  # recipient user
                return recipient_user
            elif call == 10:  # final sender account fetch
                return sender_account
            elif call == 11:  # final recipient account fetch
                return recipient_account
    
    db.query = lambda model: CustomQueryStub()
    
    # Mock generate_transaction_code
    from src.services import payment_reference
    original_generate = payment_reference.PaymentReferenceService.generate_transaction_code
    payment_reference.PaymentReferenceService.generate_transaction_code = lambda db: "SHARED999"
    
    try:
        PaymentHistoryService.update_transaction_payment_history(
            db, transaction, "Transfer payment"
        )
        
        # Verify both accounts were added to session
        assert len(db.added) == 2
        assert sender_account in db.added
        assert recipient_account in db.added
        
        # Verify commit was called
        assert db.committed
        
        # Verify payment history was added to both accounts
        assert len(sender_account.payment_history) == 1
        assert len(recipient_account.payment_history) == 1
        
        # Verify sender history (debit)
        sender_history = sender_account.payment_history[0]
        assert sender_history["type"] == "Debit"
        assert sender_history["amount"] == -500.00
        assert sender_history["code"] == "SHARED999"
        
        # Verify recipient history (credit)
        recipient_history = recipient_account.payment_history[0]
        assert recipient_history["type"] == "Credit"
        assert recipient_history["amount"] == 500.00
        assert recipient_history["code"] == "SHARED999"
        
        # Verify they share the same transaction code
        assert sender_history["code"] == recipient_history["code"]
        
    finally:
        payment_reference.PaymentReferenceService.generate_transaction_code = original_generate


def test_update_transaction_payment_history_initializes_none_arrays():
    """Test that payment_history arrays are initialized if None."""
    db = DBStub()
    
    sender_user = create_test_user(1, "Alice", "alice@example.com")
    recipient_user = create_test_user(2, "Bob", "bob@example.com")
    sender_account = create_test_account(10, 1)
    recipient_account = create_test_account(20, 2)
    
    # Set payment_history to None
    sender_account.payment_history = None
    recipient_account.payment_history = None
    
    transaction = create_test_transaction(100, 10, 20, Decimal("500.00"))
    
    call_sequence = []
    
    class CustomQueryStub:
        def filter(self, *args):
            return self
        
        def first(self):
            call = len(call_sequence)
            call_sequence.append(call)
            
            if call in [0, 5]:
                return sender_account
            elif call in [1, 6]:
                return sender_account
            elif call in [2, 7]:
                return recipient_account
            elif call in [3, 8]:
                return sender_user
            elif call in [4, 9]:
                return recipient_user
            elif call == 10:
                return sender_account
            elif call == 11:
                return recipient_account
    
    db.query = lambda model: CustomQueryStub()
    
    from src.services import payment_reference
    original_generate = payment_reference.PaymentReferenceService.generate_transaction_code
    payment_reference.PaymentReferenceService.generate_transaction_code = lambda db: "TEST123"
    
    try:
        PaymentHistoryService.update_transaction_payment_history(
            db, transaction, "Transfer"
        )
        
        # Verify arrays were initialized and populated
        assert sender_account.payment_history is not None
        assert recipient_account.payment_history is not None
        assert len(sender_account.payment_history) == 1
        assert len(recipient_account.payment_history) == 1
        
    finally:
        payment_reference.PaymentReferenceService.generate_transaction_code = original_generate


def test_update_transaction_payment_history_account_not_found():
    """Test error when accounts not found during update."""
    db = DBStub()
    transaction = create_test_transaction(100, 10, 20, Decimal("500.00"))
    
    # Make all queries return data except final account fetch
    sender_user = create_test_user(1, "Alice", "alice@example.com")
    recipient_user = create_test_user(2, "Bob", "bob@example.com")
    sender_account = create_test_account(10, 1)
    recipient_account = create_test_account(20, 2)
    
    call_count = [0]
    
    class CustomQueryStub:
        def filter(self, *args):
            return self
        
        def first(self):
            call_count[0] += 1
            if call_count[0] <= 10:
                # Return valid data for history creation
                return [sender_account, sender_account, recipient_account, sender_user, recipient_user,
                        sender_account, sender_account, recipient_account, sender_user, recipient_user][call_count[0] - 1]
            else:
                # Return None for final account fetch
                return None
    
    db.query = lambda model: CustomQueryStub()
    
    from src.services import payment_reference
    original_generate = payment_reference.PaymentReferenceService.generate_transaction_code
    payment_reference.PaymentReferenceService.generate_transaction_code = lambda db: "TEST"
    
    try:
        with pytest.raises(ValueError, match="Sender or recipient account not found when storing payment history"):
            PaymentHistoryService.update_transaction_payment_history(
                db, transaction, "Transfer"
            )
    finally:
        payment_reference.PaymentReferenceService.generate_transaction_code = original_generate


# Tests for get_payment_history_for_account
def test_get_payment_history_for_account():
    """Test retrieving payment history for an account."""
    db = DBStub()
    account = create_test_account(10, 1)
    
    # Add some payment history
    account.payment_history = [
        {"code": "TXN001", "amount": 100.0, "type": "Credit"},
        {"code": "TXN002", "amount": -50.0, "type": "Debit"},
        {"code": "TXN003", "amount": 200.0, "type": "Credit"},
    ]
    
    class SimpleQueryStub:
        def filter(self, *args):
            return self
        
        def first(self):
            return account
    
    db.query = lambda model: SimpleQueryStub()
    
    result = PaymentHistoryService.get_payment_history_for_account(db, 10)
    
    # Should be reversed (most recent first)
    assert len(result) == 3
    assert result[0]["code"] == "TXN003"
    assert result[1]["code"] == "TXN002"
    assert result[2]["code"] == "TXN001"


def test_get_payment_history_with_limit():
    """Test retrieving payment history with a limit."""
    db = DBStub()
    account = create_test_account(10, 1)
    
    # Add 5 transactions
    account.payment_history = [
        {"code": f"TXN{i:03d}", "amount": i * 10} for i in range(1, 6)
    ]
    
    class SimpleQueryStub:
        def filter(self, *args):
            return self
        
        def first(self):
            return account
    
    db.query = lambda model: SimpleQueryStub()
    
    result = PaymentHistoryService.get_payment_history_for_account(db, 10, limit=2)
    
    # Should return only 2 most recent
    assert len(result) == 2
    assert result[0]["code"] == "TXN005"
    assert result[1]["code"] == "TXN004"


def test_get_payment_history_account_not_found():
    """Test retrieving history when account doesn't exist."""
    db = DBStub()
    
    class SimpleQueryStub:
        def filter(self, *args):
            return self
        
        def first(self):
            return None
    
    db.query = lambda model: SimpleQueryStub()
    
    result = PaymentHistoryService.get_payment_history_for_account(db, 999)
    
    assert result == []


def test_get_payment_history_none_history():
    """Test retrieving history when payment_history is None."""
    db = DBStub()
    account = create_test_account(10, 1)
    account.payment_history = None
    
    class SimpleQueryStub:
        def filter(self, *args):
            return self
        
        def first(self):
            return account
    
    db.query = lambda model: SimpleQueryStub()
    
    result = PaymentHistoryService.get_payment_history_for_account(db, 10)
    
    assert result == []


# Tests for generate_payment_description
def test_generate_payment_description_basic():
    """Test generating a basic payment description."""
    result = PaymentHistoryService.generate_payment_description(
        "Alice", "Bob", Decimal("500.00")
    )
    
    assert result == "Payment of R500.00 from Alice to Bob"


def test_generate_payment_description_with_method():
    """Test generating payment description with method."""
    result = PaymentHistoryService.generate_payment_description(
        "Alice", "Bob", Decimal("500.00"), "EFT"
    )
    
    assert result == "Payment of R500.00 from Alice to Bob via EFT"


def test_generate_payment_description_with_decimals():
    """Test generating payment description with decimal amounts."""
    result = PaymentHistoryService.generate_payment_description(
        "Alice", "Bob", Decimal("123.45"), "card"
    )
    
    assert result == "Payment of R123.45 from Alice to Bob via card"