from sqlalchemy import Column, Integer, String, Numeric, UniqueConstraint
from ..config.database import SPBase

class Client(SPBase):
    __tablename__ = "clients"

    __table_args__ = (
        UniqueConstraint("email", name="uq_clients_email"),
        UniqueConstraint("phone", name="uq_clients_phone"),
    )

    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(50), unique=True, nullable=False)
    balance = Column(Numeric(12, 2), default=0)

    def __repr__(self):
        return f"<Client(id={self.id}, name='{self.name}', email='{self.email}')>"

