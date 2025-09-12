from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.models.user import User
from src.models.account import Account
from src.services.auth import AuthService
from pydantic import BaseModel
from pydantic import PositiveFloat
from typing import Optional
from decimal import Decimal
from datetime import datetime
import secrets

app = FastAPI()

# Allow CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API requests/responses
class UserLogin(BaseModel):
    email: str
    password: str


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
    balance: float
    account_id: Optional[int] = None
    account_number: Optional[str] = None

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

@app.post("/api/login", response_model=UserResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    # Authenticate user using AuthService
    user = AuthService.authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(status_code=404, detail="User not found or invalid credentials")

    # pick the first account for the user (create one if missing)
    account = db.query(Account).filter(Account.user_id == user.id).first()
    balance_value = getattr(account, 'balance', 0) if account else 0

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
    "balance": float(balance_value) if balance_value is not None else 0.0,
    "account_id": account.id if account is not None else None,
    "account_number": account.account_number if account is not None else None,
    }

@app.post("/api/signup", response_model=UserResponse)
def signup(signup_data: UserCreate, db: Session = Depends(get_db)):
    # Check if the email already exists
    existing_user = db.query(User).filter(User.email == signup_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user with hashed password via AuthService
    user = AuthService.create_user_with_password(db, signup_data.name, signup_data.email, signup_data.phone, signup_data.password)

    # create a default account for the user
    account_number = f"ACC{secrets.token_hex(6)}"
    new_account = Account(user_id=user.id, account_number=account_number, balance=0)
    db.add(new_account)
    db.commit()
    db.refresh(new_account)

    # return user info (frontend currently expects id,name,email,phone,balance)
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
    "balance": float(new_account.balance) if new_account.balance is not None else 0.0,
    "account_id": new_account.id,
    "account_number": new_account.account_number,
    }

@app.get("/api/client/{client_id}", response_model=UserResponse)
def get_client(client_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == client_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    account = db.query(Account).filter(Account.user_id == user.id).first()
    balance_value = getattr(account, 'balance', 0) if account else 0
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
    "balance": float(balance_value) if balance_value is not None else 0.0,
    "account_id": account.id if account is not None else None,
    "account_number": account.account_number if account is not None else None,
    }

@app.post("/api/topup/{client_id}")
def topup_balance(client_id: int, transaction: TransactionCreate, db: Session = Depends(get_db)):
    # interpret client_id as user_id and top up the user's first account
    user = db.query(User).filter(User.id == client_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    account = db.query(Account).filter(Account.user_id == user.id).first()
    if not account:
        # create a default account if none exists
        account_number = f"ACC{secrets.token_hex(6)}"
        account = Account(user_id=user.id, account_number=account_number, balance=0)
        db.add(account)
        db.commit()
        db.refresh(account)

    current_balance = getattr(account, 'balance', Decimal('0')) or Decimal('0')
    new_balance = current_balance + Decimal(str(transaction.amount))
    account.balance = new_balance
    db.commit()
    db.refresh(account)

    balance_value = getattr(account, 'balance', 0)
    return {
        "message": f"Successfully topped up {transaction.amount}",
        "new_balance": float(balance_value) if balance_value is not None else 0.0
    }

@app.post("/api/send/{client_id}")
def send_money(client_id: int, transaction: TransactionCreate, db: Session = Depends(get_db)):
    if not transaction.recipient_email:
        raise HTTPException(status_code=400, detail="Recipient email required")

    # Get sender's account
    sender_account = db.query(Account).filter(Account.user_id == client_id).first()
    if not sender_account:
        raise HTTPException(status_code=404, detail="Sender account not found")

    # Get recipient (user) and their account
    recipient_user = db.query(User).filter(User.email == transaction.recipient_email).first()
    if not recipient_user:
        raise HTTPException(status_code=404, detail="Recipient not found")

    recipient_account = db.query(Account).filter(Account.user_id == recipient_user.id).first()
    if not recipient_account:
        # create default recipient account if missing
        import secrets
        account_number = f"ACC{secrets.token_hex(6)}"
        recipient_account = Account(user_id=recipient_user.id, account_number=account_number, balance=0)
        db.add(recipient_account)
        db.commit()
        db.refresh(recipient_account)

    # Check balance
    sender_balance = getattr(sender_account, 'balance', Decimal('0')) or Decimal('0')
    transaction_amount = Decimal(str(transaction.amount))

    if sender_balance < transaction_amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    # Transfer money
    sender_account.balance = sender_balance - transaction_amount
    recipient_balance = getattr(recipient_account, 'balance', Decimal('0')) or Decimal('0')
    recipient_account.balance = recipient_balance + transaction_amount

    db.commit()
    db.refresh(sender_account)
    db.refresh(recipient_account)

    sender_balance_value = getattr(sender_account, 'balance', 0)
    return {
        "message": f"Successfully sent {transaction.amount} to {recipient_user.name}",
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
