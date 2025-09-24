from datetime import datetime, timedelta
from decimal import Decimal
from types import SimpleNamespace


from src.models.transaction import Transaction
from src.services.rules import RuleEngine, AMOUNT_LIMIT


# --- Minimal query/DB stubs that support the methods RuleEngine uses ---

class QueryStub:
    def __init__(self, db):
        self.db = db
    def filter(self, *a, **k):        # support: .filter(...).first() / .filter(...).count()
        return self
    def with_entities(self, *a, **k): # support: .with_entities(func.sum(...)).scalar()
        return self
    def first(self):                  # for Block queries -> pretend "no block"
        return None
    def count(self):
        # Return the number of transactions in the last 60 seconds (this simulates the burst logic)
        return len(self.db.transactions)  # Now count the transactions in the list
    def scalar(self):                 # for daily total sum
        return self.db.day_total

class DummyDB:
    def __init__(self, day_total=Decimal("0")):
        self.day_total = day_total
        self.transactions = []  # Initialize an empty list to store transactions
        self.count_return_value = 0  # For simulating count in queries

    def add(self, transaction: Transaction):
        # Add a transaction to the database (simulate adding to an actual DB)
        self.transactions.append(transaction)
        self.day_total += transaction.amount  # Update daily total for the sender's account
    
    def commit(self):
        # In a real DB, this would commit the transactions to the database
        pass  # Here it's a no-op as we're just simulating the commit
    def query(self, *args, **kwargs):
        return QueryStub(self)

class DummyAccount(SimpleNamespace): pass

def make_accounts(balance_sender="10000.00", balance_recipient="100.00"):
    return (
        DummyAccount(id=1, balance=Decimal(balance_sender)),
        DummyAccount(id=2, balance=Decimal(balance_recipient)),
    )

def test_amount_over_limit():
    db = DummyDB()
    s, r = make_accounts()
    allowed, alerts, violations = RuleEngine.evaluate(
        db, sender=s, recipient=r, amount=Decimal(AMOUNT_LIMIT) + 1
    )
    # auto block for sprint 2
    assert allowed is not True
    assert any(getattr(a, "code", "") == "AMOUNT_LIMIT" for a in alerts)
    assert "AMOUNT_TOO_LARGE" in violations


def test_daily_limit_alert():
    db = DummyDB(day_total=Decimal("9500"))
    s, r = make_accounts()
    allowed, alerts, violations = RuleEngine.evaluate(
        db, sender=s, recipient=r, amount=Decimal("600")
    )
    assert not allowed # should be blocked
    assert any(getattr(a, "code", "") == "DAILY_LIMIT" for a in alerts)
    assert "DAILY_AMOUNT_LIMIT_EXCEEDED" in violations  

def test_negative_balance():
    db = DummyDB()
    s, r = make_accounts(balance_sender="0.00")
    allowed, alerts, violations = RuleEngine.evaluate(
        db, sender=s, recipient=r, amount=Decimal("1")
    )
    assert not allowed
    assert "NEGATIVE_BAL" in violations

def test_zero_balance():
    db = DummyDB()
    s, r = make_accounts(balance_sender="1000.00")
    
    allowed, alerts, violations = RuleEngine.evaluate(
        db, sender=s, recipient=r, amount=Decimal("1000")
    )

    assert not allowed  # The transaction should not be allowed
    assert "ZERO_BAL" in violations  # The violation should be listed
    assert any(getattr(a, "code", "") == "ZERO_BAL" for a in alerts)  # There should be an alert

def test_allowed_transaction():
    db = DummyDB(day_total=Decimal("2000"))
    s, r = make_accounts(balance_sender="10000.00", balance_recipient="500.00")

    allowed, alerts, violations = RuleEngine.evaluate(
        db, sender=s, recipient=r, amount=Decimal("1000")
    )

    assert allowed is True  # The transaction should be allowed
    assert len(alerts) == 0  # No alerts should be generated
    assert len(violations) == 0  # No violations should be listed

def test_burst_limit_with_actual_transactions():
    db = DummyDB()
    s, r = make_accounts() 

    # create 4 transactions
    now = datetime.now()  # Current time
    for i in range(4):
        transaction = Transaction(
            sender_id=s.id,
            recipient_id=r.id,
            amount=Decimal("500"),
            created_at=now - timedelta(seconds=(60 - i))  # Simulate 4 transactions within the last 60 seconds
        )
        db.add(transaction)

    db.commit()

    # Evaluate the transaction with the RuleEngine
    allowed, alerts, violations = RuleEngine.evaluate(
        db, sender=s, recipient=r, amount=Decimal("500")
    )

    # Assert that the transaction is **not allowed** because there are more than 3 transactions sin the last 60s
    assert not allowed  # The transaction should be blocked due to burst limit
    assert "TOO_MANY_TRANSACTIONS_60S" in violations  # Violation should be present
    assert any(getattr(a, "code", "") == "BURSTING_60S" for a in alerts)  # Alert should be generated


