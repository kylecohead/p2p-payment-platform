from types import SimpleNamespace
from src.models.user import User
from src.models.account import Account

def test_user_and_account_repr():
    u = User(id=1, name="Luigi", email="luigi@nintendo.example", admin=False)
    a = Account(id=7, user_id=1, account_number="ACC123", balance=0)
    # exercise __repr__
    assert "User(id=1" in repr(u)
    assert "Account(id=7" in repr(a)

def test_account_get_payment_history_monkeypatched(monkeypatch):
    # Patch the PaymentHistoryService used internally
    called = {}
    class FakePHS:
        @staticmethod
        def get_payment_history_for_account(db, account_id, limit):
            called['args'] = (db, account_id, limit)
            return [{'id': 1, 'amount': '10.00'}]

    import src.services.payment_history as phs_mod
    monkeypatch.setattr(phs_mod, "PaymentHistoryService", FakePHS, raising=True)

    a = Account(id=42, user_id=1, account_number="ACC42", balance=0)
    out = a.get_payment_history(db=SimpleNamespace(), limit=5)
    assert out == [{'id': 1, 'amount': '10.00'}]
    assert called['args'][1] == 42
    assert called['args'][2] == 5
