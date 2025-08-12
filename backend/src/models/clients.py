from sqlalchemy import Column, Integer, String, Numeric
from config.database import SPBase

class Client(SPBase):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, unique=True, nullable=False)
    balance = Column(Numeric(12, 2), default=0)

    def __repr__(self):
        return f"<Client(id={self.id}, name='{self.name}', email='{self.email}')>"

