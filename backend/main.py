import json
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from src.config.database import get_db
from src.models.user import User
from src.models.account import Account
from src.services.auth import AuthService
from src.models.transaction import Transaction
from src.models.alert import Alert
from src.models.block import Block, BlockType
from src.services.rules import RuleEngine
from src.services.payment_reference import PaymentReferenceService
from src.services.payment_history import PaymentHistoryService
from pydantic import BaseModel
from pydantic import PositiveFloat
from typing import Optional, List
from decimal import Decimal
from datetime import datetime, timezone
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
    description: Optional[str] = None  # Add description field

class TransactionBase(BaseModel):
    amount: PositiveFloat
    currency: Optional[str] = "ZAR"
    status: Optional[str] = "pending"
    kind: Optional[str] = "transfer"
    method: Optional[str] = None
    reference: Optional[str] = None


class TransactionCreate(TransactionBase):
    recipient_email: Optional[str] = None
    description: Optional[str] = None


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
    admin: Optional[bool] = False

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

class TransferIn(BaseModel):
    sender_account_id: int
    recipient_account_id: int
    amount: PositiveFloat
    reference: Optional[str] = None
    method: Optional[str] = "p2p"
    description: Optional[str] = None

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
    "admin": bool(user.admin),
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
    "admin": bool(user.admin),
    }

@app.get("/api/client/{client_id}", response_model=UserResponse)
def get_client(client_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == client_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    account = db.query(Account).filter(Account.user_id == user.id).first()
    balance_value = getattr(account, 'balance', 0) if account else 0
    # Attach a small recent payment history for dashboard use
    payment_history = []
    try:
        if account:
            payment_history = account.get_payment_history(db, limit=5)
    except Exception:
        payment_history = []

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "balance": float(balance_value) if balance_value is not None else 0.0,
        "account_id": account.id if account is not None else None,
        "account_number": account.account_number if account is not None else None,
        "admin": bool(user.admin),
        "recent_payment_history": payment_history,
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

# Delegate requests to /api/transfers
@app.post("/api/send/{client_id}")
def send_money(client_id: int, transaction: TransactionCreate, db: Session = Depends(get_db)):
    if not transaction.recipient_email:
        raise HTTPException(status_code=400, detail="Recipient email required")
    sender_account = db.query(Account).filter(Account.user_id == client_id).first()
    if not sender_account: raise HTTPException(status_code=404, detail="Sender account not found")
    recipient_user = db.query(User).filter(User.email == transaction.recipient_email).first()
    if not recipient_user: raise HTTPException(status_code=404, detail="Recipient not found")
    recipient_account = db.query(Account).filter(Account.user_id == recipient_user.id).first()
    if not recipient_account:
        account_number = f"ACC{secrets.token_hex(6)}"
        recipient_account = Account(user_id=recipient_user.id, account_number=account_number, balance=0)
        db.add(recipient_account); db.commit(); db.refresh(recipient_account)
    payload = TransferIn(sender_account_id=sender_account.id, recipient_account_id=recipient_account.id,
                         amount=transaction.amount, reference=transaction.reference, method="p2p", 
                         description=transaction.description or "Payment transfer")
    return create_transfer(payload, db)

@app.post("/api/transfers")
def create_transfer(payload: TransferIn, db: Session = Depends(get_db)):
    amount = Decimal(str(payload.amount))

    # Lock both accounts in a deterministic order to avoid deadlocks
    try:
        # Lock by sorted ids so every concurrent request locks in the same order
        acct_ids = sorted([payload.sender_account_id, payload.recipient_account_id])

        locked_accounts = (db.query(Account)
            .filter(Account.id.in_(acct_ids))
            .with_for_update()
            .all())

        # Map back to sender/recipient after the lock
        locked_map = {a.id: a for a in locked_accounts}
        sender = locked_map.get(payload.sender_account_id)
        recipient = locked_map.get(payload.recipient_account_id)

        if not sender or not recipient:
            db.rollback()
            raise HTTPException(status_code=404, detail="Sender or recipient account not found")

        # Evaluate rules against the locked snapshot
        allowed, alerts = RuleEngine.evaluate(
            db, sender=sender, recipient=recipient, amount=amount
        )

        # Not allowed: rollback to drop locks, then persist alerts separately and return 409
        if not allowed:
            db.rollback()                       # release row locks
            for a in alerts:
                db.add(a)
            db.commit()                       # persist alerts even for blocked attempts
            raise HTTPException(status_code=409, detail={"GG you are cooked"})

        # Allowed: move funds + create transaction atomically under the same lock
        # Generate unique reference for this transaction
        unique_reference = PaymentReferenceService.generate_unique_reference(db)
        
        # Use description from payload or create default
        description = payload.description or "Payment transfer"
        
        tx = Transaction(
            sender_id=sender.id,
            recipient_id=recipient.id,
            amount=amount,
            currency="ZAR",
            status="completed",
            kind="transfer",
            method=payload.method,
            reference=unique_reference,
            description=description,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        sender.balance = (sender.balance or Decimal("0")) - amount
        recipient.balance = (recipient.balance or Decimal("0")) + amount

        db.add(tx)
        db.flush() # assign ID to tx

        # Generate payment history for the transaction
        try:
            PaymentHistoryService.update_transaction_payment_history(
                db, tx, description
            )
        except Exception as e:
            # Log the error but don't fail the transaction
            print(f"Warning: Failed to generate payment history: {e}")

        for a in alerts:
            a.transaction_id = tx.id
            db.add(a)

        db.commit()  # commits both balance changes + transaction + alerts

        db.refresh(tx)
        db.refresh(sender)

        return {
            "transaction_id": tx.id,
            "status": tx.status,
            "alerts": [{"code": a.code, "message": a.message} for a in alerts],
            "new_balance": float(sender.balance or Decimal("0")),
        }

    except SQLAlchemyError:
        db.rollback()
        raise

# Admin: alerts & blocks
@app.get("/api/admin/alerts")
def list_alerts(cleared: Optional[bool] = None, db: Session = Depends(get_db)):
    q = db.query(Alert); 
    if cleared is not None: q = q.filter(Alert.cleared == cleared)
    alerts = q.order_by(Alert.created_at.desc()).limit(200).all()
    return [{"id": a.id, "code": a.code, "message": a.message, "cleared": a.cleared,
             "transaction_id": a.transaction_id, "sender_account_id": a.sender_account_id,
             "recipient_account_id": a.recipient_account_id, "created_at": a.created_at.isoformat()} for a in alerts]

@app.post("/api/admin/alerts/{alert_id}/clear")
def clear_alert(alert_id: int, db: Session = Depends(get_db)):
    a = db.query(Alert).get(alert_id)
    if not a: raise HTTPException(status_code=404, detail="Alert not found")
    a.cleared = True; a.updated_at = datetime.now(timezone.utc); db.commit()
    return {"ok": True}

class BlockIn(BaseModel):
    block_type: BlockType; subject_account_id: int; reason: Optional[str] = None

@app.post("/api/admin/block")
def create_block(payload: BlockIn, db: Session = Depends(get_db)):
    b = Block(block_type=payload.block_type, subject_account_id=payload.subject_account_id,
              reason=payload.reason, created_at=datetime.now(timezone.utc))
    db.add(b); db.commit()
    return {"ok": True, "id": b.id}

@app.post("/api/admin/unblock/{block_id}")
def remove_block(block_id: int, db: Session = Depends(get_db)):
    b = db.query(Block).get(block_id)
    if not b: raise HTTPException(status_code=404, detail="Block not found")
    if b.removed_at is None: b.removed_at = datetime.now(timezone.utc); db.commit()
    return {"ok": True}

@app.get("/api/payment-history/{client_id}")
def get_payment_history(client_id: int, limit: int = 100, db: Session = Depends(get_db)):
    """Get payment history for a client's account."""
    # Get the user's account
    account = db.query(Account).filter(Account.user_id == client_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    try:
        payment_histories = PaymentHistoryService.get_payment_history_for_account(
            db, account.id, limit
        )
        return {
            "payment_history": payment_histories,
            "total_count": len(payment_histories)
        }
    except Exception as e:
        # Return empty list if there's an error (e.g., no payment history yet)
        return {
            "payment_history": [],
            "total_count": 0,
            "error": str(e)
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
