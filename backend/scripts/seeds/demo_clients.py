from decimal import Decimal
from src.config.database import LocalSession
from src.models.user import User
from src.models.account import Account
from src.services.auth import AuthService

SEED_USERS = [
    {
        "name": "Alice M. Cooper",
        "email": "alice.cooper@example.local",
        "phone": "+27-71-111-2233",
        "balance": Decimal("12.50"),
        "password": "Password1!",
    },
    {
        "name": "Bob K. Johnson",
        "email": "bob.johnson@example.local",
        "phone": "+27-72-222-3344",
        "balance": Decimal("250.00"),
        "password": "Password1!",
    },
    {
        "name": "Carol N. Peters",
        "email": "carol.peters@example.local",
        "phone": "+27-73-333-4455",
        "balance": Decimal("1024.75"),
        "password": "Password1!",
    },
    {
        "name": "Demo Merchant",
        "email": "merchant@example.local",
        "phone": "+27-74-444-5566",
        "balance": Decimal("5000.00"),
        "password": "MerchantPass1$",
    },
]

def run():
    with LocalSession() as db:
        created = 0
        for data in SEED_USERS:
            exists = db.query(User).filter_by(email=data["email"]).first()
            if exists:
                acct = db.query(Account).filter_by(user_id=exists.id).first()
                if not acct:
                    acct = Account(
                        user_id=exists.id,
                        account_number=f"ACCT{exists.id:08d}",
                        balance=data["balance"],
                    )
                    db.add(acct)
                    db.commit()
                    created += 1
                continue

            user = User(
                name=data["name"],
                email=data["email"],
                phone=data["phone"],
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            try:
                AuthService.set_user_password(user, data.get("password", "password123"))
                db.add(user)
                db.commit()
            except Exception:
                pass

            account = Account(
                user_id=user.id,
                account_number=f"ACCT{user.id:08d}",
                balance=data["balance"],
            )
            db.add(account)
            db.commit()
            created += 1

        print(f"Seed complete. New rows (users/accounts added): {created}")


if __name__ == "__main__":
    run()