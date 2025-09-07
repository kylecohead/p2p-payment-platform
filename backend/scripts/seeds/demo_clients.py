from decimal import Decimal
from src.config.database import LocalSession
from src.models.user import User
from src.models.account import Account

SEED_USERS = [
    {"name": "Alice ", "email": "alice@gmail.com", "phone": "111111", "balance": Decimal("0")},
    {"name": "Bob ",   "email": "bob@gmail.com",   "phone": "222222", "balance": Decimal("25.50")},
    {"name": "Carol ", "email": "carol@gmail.com", "phone": "333333", "balance": Decimal("100.00")},
]

def run():
    with LocalSession() as db:
        created = 0
        for data in SEED_USERS:
            exists = db.query(User).filter_by(email=data["email"]).first()
            if exists:
                continue
            user = User(
                name=data["name"],
                email=data["email"],
                phone=data["phone"],
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            # set a default password for seeded users (for dev only)
            user.set_password("password123")
            db.add(user)
            db.commit()
            db.refresh(user)
            account = Account(
                user_id=user.id,
                account_number=f"ACCT{user.id:08d}",
                balance=data["balance"],
            )
            db.add(account)
            created += 1
        if created:
            db.commit()
        print(f"Seed complete. New rows: {created}")


if __name__ == "__main__":
    run()