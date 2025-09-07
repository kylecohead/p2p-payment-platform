from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.models.clients import Client
from pydantic import BaseModel
from pydantic import PositiveFloat
from typing import Optional
from decimal import Decimal
from datetime import datetime

app = FastAPI()

# Allow CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://100.102.145.100:*", "http://localhost:*", "*"],  # Allow Tailscale IP and localhost
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API requests/responses
class ClientLogin(BaseModel):
    email: str
    password: str

class ClientSignup(BaseModel):
    name: str
    email: str
    phone: str
    password: str

class ClientResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    balance: float

class TransactionRequest(BaseModel):
    amount: PositiveFloat
    recipient_email: Optional[str] = None

class TransactionBase(BaseModel):
    amount: PositiveFloat
    currency: Optional[str] = "ZAR"
    status: Optional[str] = "pending"
    kind: Optional[str] = "transfer"
    method: Optional[str] = None
    reference: Optional[str] = None


class TransactionCreate(TransactionBase):
    recipient_email: Optional[str] = None


class TransactionResponse(TransactionBase):
    id: int
    sender_id: int
    recipient_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class UserBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int

    class Config:
        orm_mode = True


class AccountBase(BaseModel):
    account_number: str
    balance: float = 0.0


class AccountResponse(AccountBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True

@app.get("/")
def read_root():
    return {"message": "Waluigi Backend API"}

@app.post("/api/login")
def login(login_data: ClientLogin, db: Session = Depends(get_db)):
    # Simple login - find client by email (password validation would be added later)
    client = db.query(Client).filter(Client.email == login_data.email).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    balance_value = getattr(client, 'balance', 0)
    return {
        "id": client.id,
        "name": client.name,
        "email": client.email,
        "phone": client.phone,
        "balance": float(balance_value) if balance_value is not None else 0.0
    }

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Utility function to hash passwords
#def hash_password(password: str) -> str:
#    return pwd_context.hash(password)

@app.post("/api/signup")
def signup(signup_data: ClientSignup, db: Session = Depends(get_db)):
    # Check if the email already exists
    existing_client = db.query(Client).filter(Client.email == signup_data.email).first()
    if existing_client:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash the password before saving
    # hashed_password = hash_password(signup_data.password)

    # Create a new client and add to the database
    new_client = Client(
        name=signup_data.name,
        email=signup_data.email,
        phone=signup_data.phone,
       # password=hashed_password,  # Save hashed password
        balance=0  # Set initial balance to 0
    )

    db.add(new_client)
    db.commit()
    db.refresh(new_client)

    return {
        "message": "Client created successfully",
        "id": new_client.id,
        "name": new_client.name,
        "email": new_client.email,
        "phone": new_client.phone,
        "balance": new_client.balance
    }

@app.get("/api/client/{client_id}")
def get_client(client_id: int, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    balance_value = getattr(client, 'balance', 0)
    return {
        "id": client.id,
        "name": client.name,
        "email": client.email,
        "phone": client.phone,
        "balance": float(balance_value) if balance_value is not None else 0.0
    }

@app.post("/api/topup/{client_id}")
def topup_balance(client_id: int, transaction: TransactionRequest, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    current_balance = getattr(client, 'balance', Decimal('0')) or Decimal('0')
    new_balance = current_balance + Decimal(str(transaction.amount))
    setattr(client, 'balance', new_balance)
    db.commit()
    db.refresh(client)

    balance_value = getattr(client, 'balance', 0)
    return {
        "message": f"Successfully topped up {transaction.amount}",
        "new_balance": float(balance_value) if balance_value is not None else 0.0
    }

@app.post("/api/send/{client_id}")
def send_money(client_id: int, transaction: TransactionRequest, db: Session = Depends(get_db)):
    if not transaction.recipient_email:
        raise HTTPException(status_code=400, detail="Recipient email required")

    # Get sender
    sender = db.query(Client).filter(Client.id == client_id).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found")

    # Get recipient
    recipient = db.query(Client).filter(Client.email == transaction.recipient_email).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    # Check balance
    sender_balance = getattr(sender, 'balance', Decimal('0')) or Decimal('0')
    transaction_amount = Decimal(str(transaction.amount))

    if sender_balance < transaction_amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    # Transfer money
    new_sender_balance = sender_balance - transaction_amount
    recipient_balance = getattr(recipient, 'balance', Decimal('0')) or Decimal('0')
    new_recipient_balance = recipient_balance + transaction_amount

    setattr(sender, 'balance', new_sender_balance)
    setattr(recipient, 'balance', new_recipient_balance)

    db.commit()
    db.refresh(sender)
    db.refresh(recipient)

    sender_balance_value = getattr(sender, 'balance', 0)
    return {
        "message": f"Successfully sent {transaction.amount} to {recipient.name}",
        "new_balance": float(sender_balance_value) if sender_balance_value is not None else 0.0
    }
if __name__ == "__main__":
    import uvicorn
    import os
    from dotenv import load_dotenv

    load_dotenv()
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))

    print(f"Starting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
