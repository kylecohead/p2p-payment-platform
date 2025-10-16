import os
import sys


def test_database_raises_without_env(monkeypatch):
    # Force DATABASE_URL to be empty BEFORE import so the module raises.
    monkeypatch.setenv("DATABASE_URL", "")
    # Ensure a fresh import so it re-reads env & .env
    sys.modules.pop("src.config.database", None)

    try:
        import src.config.database as _  # noqa: F401
        assert False, "Expected RuntimeError when DATABASE_URL missing"
    except RuntimeError as e:
        assert "DATABASE_URL" in str(e)


def test_get_db_yields_and_closes(monkeypatch):
    # Provide a valid, in-memory URL BEFORE import.
    monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")
    sys.modules.pop("src.config.database", None)
    import src.config.database as database

    gen = database.get_db()
    db = next(gen)
    assert db is not None
    # Stop the generator to trigger close()
    try:
        next(gen)
    except StopIteration:
        pass
