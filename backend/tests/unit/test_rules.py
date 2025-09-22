from decimal import Decimal
from types import SimpleNamespace

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
    def count(self):                  # for burst-window count -> 0 by default
        return 0
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
    # Soft violation: allowed but flagged for admin review
    assert allowed is True
    assert any(getattr(a, "code", "") == "AMOUNT_LIMIT" for a in alerts)
    # And it should *not* be a hard-block code
    assert not any(v in ("BLOCKED_SENDER", "BLOCKED_RECIPIENT", "NEGATIVE_BAL") for v in violations)


def test_daily_limit_alert():
    db = DummyDB(day_total=Decimal("9500"))
    s, r = make_accounts()
    allowed, alerts, violations = RuleEngine.evaluate(
        db, sender=s, recipient=r, amount=Decimal("600")
    )
    assert allowed                         # should still be allowed
    assert any(getattr(a, "code", "") == "DAILY_LIMIT" for a in alerts)

def test_negative_balance():
    db = DummyDB()
    s, r = make_accounts(balance_sender="0.00")
    allowed, alerts, violations = RuleEngine.evaluate(
        db, sender=s, recipient=r, amount=Decimal("1")
    )
    assert not allowed
    assert "NEGATIVE_BAL" in violations
