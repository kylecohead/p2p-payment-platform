from src.services.auth import AuthService

def test_password_hash_and_verify():
    raw = "s3cret!"
    hashed = AuthService.hash_password(raw)
    # test properly hashed, still valid pasword and invalid password
    assert hashed != raw
    assert AuthService.verify_password(raw, hashed)
    assert not AuthService.verify_password("wrong", hashed)