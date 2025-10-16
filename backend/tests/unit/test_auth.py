from src.services.auth import AuthService
from src.models.user import User


def test_password_hash_and_verify():
    raw = "s3cret!"
    hashed = AuthService.hash_password(raw)
    assert hashed != raw
    assert AuthService.verify_password(raw, hashed)
    assert not AuthService.verify_password("wrong", hashed)


def test_set_and_check_password():
    u = User(id=1, name="Waluigi", email="wal@ex", phone="123")
    # There is no is_password_set(); check the actual attribute.
    assert getattr(u, "password_hash", None) in (None, "")
    AuthService.set_user_password(u, "rosebud")
    assert u.password_hash and isinstance(u.password_hash, str)
    assert AuthService.verify_password("rosebud", u.password_hash)
    assert not AuthService.verify_password("nope", u.password_hash)


def test_authenticate_user_success_and_fail():
    # Minimal stub that matches AuthService.authenticate_user usage:
    # db.query(User).filter(<expr>).first()
    class QueryStub:
        def __init__(self, user):
            self._user = user

        def filter(self, *args, **kwargs):
            # We don't need to parse the SQLAlchemy expression; just return self.
            return self

        def first(self):
            return self._user

    class DBStub:
        def __init__(self, user):
            self._user = user

        def query(self, model):
            assert model.__name__ == "User"
            return QueryStub(self._user)

    # Existing user with a password
    u = User(id=2, name="Daisy", email="daisy@ex", phone="321")
    AuthService.set_user_password(u, "flower")

    # happy path: user present + correct password
    assert AuthService.authenticate_user(DBStub(u), "daisy@ex", "flower") is u

    # wrong password: user present but invalid password
    assert AuthService.authenticate_user(DBStub(u), "daisy@ex", "wrong") is None

    # unknown email: simulate "no user found" by returning None from .first()
    assert AuthService.authenticate_user(DBStub(None), "unknown@ex", "flower") is None


def test_create_user_with_password_commits_and_returns():
    captured = {"added": [], "commits": 0, "refreshed": []}

    class DBStub:
        def add(self, obj):
            captured["added"].append(obj)

        def commit(self):
            captured["commits"] += 1

        def refresh(self, obj):
            captured["refreshed"].append(obj)

    db = DBStub()
    user = AuthService.create_user_with_password(
        db, name="Peach", email="peach@ex", phone="000", password="cake", admin=True
    )

    assert user in captured["added"]
    assert captured["commits"] == 1
    assert user in captured["refreshed"]
    assert user.admin is True
    assert user.password_hash and isinstance(user.password_hash, str)
