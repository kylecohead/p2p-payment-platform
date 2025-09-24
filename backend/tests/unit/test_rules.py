from datetime import datetime, timedelta, timezone
from decimal import Decimal
from types import SimpleNamespace


from src.models.transaction import Transaction
from src.services.rules import BURST_WINDOW_SECONDS, RuleEngine, AMOUNT_LIMIT
from src.models.block import Block, BlockType


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
    def count(self):                  # for burst-window count -> 0 by default
        return self.db.count_return_value if hasattr(self.db, 'count_return_value') else 0
    def scalar(self):                 # for daily total sum
        return self.db.day_total

class DummyDB:
    def __init__(self, day_total=Decimal("0")):
        self.day_total = day_total
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

