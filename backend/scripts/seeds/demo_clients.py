from decimal import Decimal
from src.config.database import LocalSession
from src.models.clients import Client

SEED_CLIENTS = [
    {"name": "Alice ", "email": "alice@gmail.com", "phone": "111111", "balance": Decimal("0")},
    {"name": "Bob ",   "email": "bob@gmail.com",   "phone": "222222", "balance": Decimal("25.50")},
    {"name": "Carol ", "email": "carol@gmail.com", "phone": "333333", "balance": Decimal("100.00")},
]

def run():
    with LocalSession() as db:
        created = 0
        for data in SEED_CLIENTS:
            exists = db.query(Client).filter_by(email=data["email"]).first()
            if exists:
                continue
            client = Client(
                name=data["name"],
                email=data["email"],
                phone=data["phone"],
                balance=data["balance"],
            )
            db.add(client)
            created += 1
        if created:
            db.commit()
        print(f"Seed complete. New rows: {created}")

if __name__ == "__main__":
    run()