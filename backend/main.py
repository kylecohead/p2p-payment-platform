import json
import asyncio
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from src.config.database import get_db
from src.models.user import User
from src.models.account import Account
from src.services.auth import AuthService
from src.models.transaction import Transaction
from src.models.alert import Alert
from src.models.block import Block, BlockType
from src.models.beneficiary import Beneficiary
from src.services.rules import RuleEngine
from src.services.payment_reference import PaymentReferenceService
from src.services.payment_history import PaymentHistoryService
from src.services.csv_export import CSVExportService
from pydantic import BaseModel
from pydantic import PositiveFloat
from typing import Optional, List, Dict, Set
from decimal import Decimal
from datetime import datetime, timezone
import secrets
import asyncio
import weakref

import signal
import asyncio
from contextlib import asynccontextmanager, redirect_stderr
import logging
import warnings
import sys
import os
from io import StringIO

# Suppress specific warnings 
warnings.filterwarnings("ignore", message="Valid config keys have changed in V2")

# Context manager to suppress stderr during shutdown
@asynccontextmanager
async def suppress_shutdown_errors():
    """Temporarily suppress stderr to hide shutdown error traces"""
    old_stderr = sys.stderr
    try:
        sys.stderr = StringIO()  # Capture stderr instead of printing
        yield
    finally:
        sys.stderr = old_stderr

# Global notification system for SSE - using async queues instead of threading
class NotificationManager:
    def __init__(self):
        self.subscribers: Dict[int, Set[asyncio.Queue]] = {}
        self.lock = asyncio.Lock()
        self._shutdown = False
    
    async def subscribe(self, client_id: int) -> asyncio.Queue:
        """Subscribe a client to notifications"""
        if self._shutdown:
            raise ConnectionError("Server is shutting down")
            
        client_queue = asyncio.Queue()
        async with self.lock:
            if client_id not in self.subscribers:
                self.subscribers[client_id] = set()
            self.subscribers[client_id].add(client_queue)
        return client_queue
    
    async def unsubscribe(self, client_id: int, client_queue: asyncio.Queue):
        """Unsubscribe a client from notifications"""
        async with self.lock:
            if client_id in self.subscribers:
                self.subscribers[client_id].discard(client_queue)
                if not self.subscribers[client_id]:
                    del self.subscribers[client_id]
    
    async def notify(self, client_id: int, event_type: str, data: dict):
        """Send notification to all subscribers of a client"""
        if self._shutdown:
            return  # Don't send notifications during shutdown
            
        print(f"NotificationManager: Attempting to notify client {client_id} with event {event_type}")
        
        async with self.lock:
            if client_id in self.subscribers:
                print(f"NotificationManager: Found {len(self.subscribers[client_id])} subscribers for client {client_id}")
                message = {
                    "type": event_type,
                    "client_id": client_id,
                    "data": data,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                # Send to all queues for this client
                dead_queues = []
                for client_queue in self.subscribers[client_id].copy():
                    try:
                        await client_queue.put(message)
                        print(f"NotificationManager: Successfully sent notification to client {client_id}")
                    except Exception as e:
                        # Mark queue for removal (client disconnected)
                        print(f"NotificationManager: Failed to send to client {client_id}: {e}")
                        dead_queues.append(client_queue)
                
                # Remove dead queues
                for dead_queue in dead_queues:
                    self.subscribers[client_id].discard(dead_queue)
            else:
                print(f"NotificationManager: No subscribers found for client {client_id}")
                print(f"NotificationManager: Current subscribers: {list(self.subscribers.keys())}")
    
    async def shutdown(self):
        """Shutdown notification manager and close all connections"""
        print("NotificationManager: Starting shutdown...")
        self._shutdown = True
        
        async with self.lock:
            # Send shutdown signal to all queues
            for client_id, queues in self.subscribers.items():
                for queue in queues:
                    try:
                        await queue.put({"type": "shutdown"})
                    except Exception as e:
                        print(f"Error sending shutdown signal to client {client_id}: {e}")
            
            # Give a moment for messages to be processed
            await asyncio.sleep(0.1)
            
            # Clear all subscribers
            self.subscribers.clear()
            print("NotificationManager: Shutdown complete")

# Global notification manager instance
notification_manager = NotificationManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up...")
    yield
    # Shutdown
    print("Shutting down...")
    await notification_manager.shutdown()

app = FastAPI(lifespan=lifespan)

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

@app.get("/api/events/{client_id}")
async def get_events(client_id: int):
    """Server-Sent Events endpoint for real-time notifications"""
    
    async def event_stream():
        try:
            client_queue = await notification_manager.subscribe(client_id)
        except ConnectionError:
            # Server is shutting down
            return
            
        try:
            while not notification_manager._shutdown:
                try:
                    # Wait for a message with very short timeout (1s) for fastest shutdown
                    message = await asyncio.wait_for(client_queue.get(), timeout=1.0)
                    
                    # Handle shutdown signal
                    if message.get("type") == "shutdown":
                        print(f"SSE client {client_id} received shutdown signal")
                        break
                        
                    print(f"SSE: Sending message to client {client_id}: {message.get('type')}")
                    yield f"data: {json.dumps(message)}\n\n"
                except asyncio.TimeoutError:
                    # Send keepalive ping every 1 second and check shutdown
                    if not notification_manager._shutdown:
                        yield f"data: {json.dumps({'type': 'ping', 'timestamp': datetime.now(timezone.utc).isoformat()})}\n\n"
                    else:
                        # Shutdown detected during timeout, break immediately
                        break
                except asyncio.CancelledError:
                    print(f"SSE client {client_id} connection cancelled")
                    break
                except Exception as e:
                    print(f"SSE error for client {client_id}: {e}")
                    break
        except asyncio.CancelledError:
            print(f"SSE client {client_id} outer cancelled")
        finally:
            try:
                await notification_manager.unsubscribe(client_id, client_queue)
                print(f"SSE client {client_id} disconnected")
            except:
                pass
    
    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive", 
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )

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
async def topup_balance(client_id: int, transaction: TransactionCreate, db: Session = Depends(get_db)):
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

    # Send real-time notification for topup
    try:
        await notification_manager.notify(
            client_id,
            "balance_updated",
            {
                "new_balance": float(new_balance),
                "transaction_type": "topup",
                "amount": float(transaction.amount),
                "description": transaction.description or "Account top-up"
            }
        )
    except Exception as e:
        # Don't let notification errors block the topup
        print(f"Notification error: {e}")

    balance_value = getattr(account, 'balance', 0)
    return {
        "message": f"Successfully topped up {transaction.amount}",
        "new_balance": float(balance_value) if balance_value is not None else 0.0
    }

# Delegate requests to /api/transfers
@app.post("/api/send/{client_id}")
async def send_money(client_id: int, transaction: TransactionCreate, db: Session = Depends(get_db)):
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
    return await create_transfer(payload, db)

@app.post("/api/transfers")
async def create_transfer(payload: TransferIn, db: Session = Depends(get_db)):
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

        # Check if sender is blocked from sending
        sender_block = db.query(Block).filter(
            Block.block_type == BlockType.SENDER,
            Block.subject_account_id == sender.id,
            Block.removed_at.is_(None)
        ).first()
        
        if sender_block:
            db.rollback()
            raise HTTPException(status_code=403, detail=f"Sender account is blocked: {sender_block.reason}")
        
        # Check if recipient is blocked from receiving
        recipient_block = db.query(Block).filter(
            Block.block_type == BlockType.RECIPIENT,
            Block.subject_account_id == recipient.id,
            Block.removed_at.is_(None)
        ).first()
        
        if recipient_block:
            db.rollback()
            raise HTTPException(status_code=403, detail=f"Recipient account is blocked: {recipient_block.reason}")

        # Evaluate rules against the locked snapshot
        allowed, alerts, violations = RuleEngine.evaluate(
            db, sender=sender, recipient=recipient, amount=amount
        )

        # Not allowed: rollback to drop locks, then persist alerts separately and return 409
        if not allowed:
            db.rollback()                       # release row locks
            for a in alerts:
                db.add(a)
            db.commit()     
            message = "Violations: " + ", ".join(violations)
            raise HTTPException(status_code=409, detail=message)

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
        db.refresh(recipient)

        # Send real-time notifications to both sender and recipient
        sender_user = db.query(User).filter(User.id == sender.user_id).first()
        recipient_user = db.query(User).filter(User.id == recipient.user_id).first()
        
        print(f"Transaction completed: Sender user {sender_user.id if sender_user else 'None'}, Recipient user {recipient_user.id if recipient_user else 'None'}")
        
        # Create notification tasks but don't await them to avoid blocking
        notification_tasks = []
        
        # Notify sender
        if sender_user:
            print(f"Preparing notification for sender {sender_user.id}")
            notification_tasks.append(
                notification_manager.notify(
                    sender_user.id,
                    "balance_updated",
                    {
                        "new_balance": float(sender.balance or Decimal("0")),
                        "transaction_type": "sent",
                        "amount": float(amount),
                        "description": description,
                        "recipient": recipient_user.name if recipient_user else "Unknown",
                        "transaction_id": tx.id
                    }
                )
            )
        
        # Notify recipient  
        if recipient_user:
            print(f"Preparing notification for recipient {recipient_user.id}")
            notification_tasks.append(
                notification_manager.notify(
                    recipient_user.id,
                    "balance_updated", 
                    {
                        "new_balance": float(recipient.balance or Decimal("0")),
                        "transaction_type": "received",
                        "amount": float(amount),
                        "description": description,
                        "sender": sender_user.name if sender_user else "Unknown",
                        "transaction_id": tx.id
                    }
                )
            )

        # Notify all admin users about the new transaction
        try:
            admin_users = db.query(User).filter(User.admin == True).all()
            for admin in admin_users:
                # Don't send duplicate notification if admin is sender or recipient
                if admin.id not in [sender_user.id if sender_user else None, recipient_user.id if recipient_user else None]:
                    notification_tasks.append(
                        notification_manager.notify(
                            admin.id,
                            "admin_transaction_update",
                            {
                                "transaction_id": tx.id,
                                "transaction_code": unique_reference,
                                "sender": sender_user.name if sender_user else "Unknown",
                                "recipient": recipient_user.name if recipient_user else "Unknown",
                                "amount": float(amount),
                                "description": description,
                                "has_alerts": len(alerts) > 0
                            }
                        )
                    )
        except Exception as e:
            print(f"Error preparing admin notifications: {e}")

        # Execute notifications in background
        try:
            print(f"Executing {len(notification_tasks)} notification tasks")
            await asyncio.gather(*notification_tasks, return_exceptions=True)
            print("Notifications sent successfully")
        except Exception as e:
            print(f"Notification error: {e}")

        #when sender pays recipient for the first time, add to beneficiaries table
        try:
            # Check if beneficiary already exists for the sender's user
            sender_user = db.query(User).filter(User.id == sender.user_id).first()
            recipient_user_obj = db.query(User).filter(User.id == recipient.user_id).first()
            if sender_user and recipient_user_obj:
                exists = db.query(Beneficiary).filter(
                    Beneficiary.owner_user_id == sender_user.id,
                    Beneficiary.recipient_user_id == recipient_user_obj.id
                ).first()
                if not exists:
                    b = Beneficiary(
                        owner_user_id=sender_user.id,
                        recipient_user_id=recipient_user_obj.id,
                        name=recipient_user_obj.name,
                        email=recipient_user_obj.email,
                        account_id=recipient.id,
                        account_number=getattr(recipient, 'account_number', None)
                    )
                    db.add(b)
                    db.commit()
                else:
                    # update last_used_at and usage_count
                    exists.last_used_at = datetime.now(timezone.utc)
                    exists.usage_count = (exists.usage_count or 0) + 1
                    db.add(exists)
                    db.commit()
        except Exception as e:
            # non-fatal - beneficiary upsert failure shouldn't break transfer
            print(f"Warning: beneficiary upsert failed: {e}")

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
@app.get("/api/admin/transactions")
def list_all_transactions(
    status_filter: Optional[str] = None, 
    limit: int = 200,
    db: Session = Depends(get_db)
):
    """Get all transactions for admin view with enriched data including alerts and blocks"""
    # Get transactions
    q = db.query(Transaction)
    q = q.order_by(Transaction.created_at.desc()).limit(limit)
    transactions = q.all()
    
    result = []
    for tx in transactions:
        # Get sender and recipient users
        sender_account = db.query(Account).filter(Account.id == tx.sender_id).first()
        recipient_account = db.query(Account).filter(Account.id == tx.recipient_id).first()
        
        sender_user = db.query(User).filter(User.id == sender_account.user_id).first() if sender_account else None
        recipient_user = db.query(User).filter(User.id == recipient_account.user_id).first() if recipient_account else None
        
        # Check for alerts on this transaction
        alerts = db.query(Alert).filter(Alert.transaction_id == tx.id).all()
        has_alert = len(alerts) > 0
        alert_cleared = all(a.cleared for a in alerts) if alerts else False
        
        # Check if sender or recipient is blocked
        sender_blocked = False
        recipient_blocked = False
        
        if sender_account:
            sender_block = db.query(Block).filter(
                Block.subject_account_id == sender_account.id,
                Block.block_type == BlockType.SENDER,
                Block.removed_at.is_(None)
            ).first()
            sender_blocked = sender_block is not None
        
        if recipient_account:
            recipient_block = db.query(Block).filter(
                Block.subject_account_id == recipient_account.id,
                Block.block_type == BlockType.RECIPIENT,
                Block.removed_at.is_(None)
            ).first()
            recipient_blocked = recipient_block is not None
        
        # Determine overall status
        if has_alert and not alert_cleared:
            overall_status = "Flagged"
        elif sender_blocked or recipient_blocked:
            overall_status = "Blocked"
        else:
            overall_status = "Succeeded"
        
        # Apply status filter if provided
        if status_filter and overall_status != status_filter:
            continue
            
        result.append({
            "id": tx.id,
            "code": tx.reference or f"TX{tx.id:06d}",
            "status": overall_status,
            "description": tx.description or "Payment transfer",
            "time": tx.created_at.strftime("%H:%M"),
            "date": tx.created_at.strftime("%Y-%m-%d"),
            "amount": float(tx.amount),
            "currency": tx.currency,
            "sender": {
                "account_id": sender_account.id if sender_account else None,
                "user_id": sender_user.id if sender_user else None,
                "name": sender_user.name if sender_user else "Unknown",
                "email": sender_user.email if sender_user else "unknown@email.com",
                "blocked": sender_blocked
            },
            "receiver": {
                "account_id": recipient_account.id if recipient_account else None,
                "user_id": recipient_user.id if recipient_user else None,
                "name": recipient_user.name if recipient_user else "Unknown",
                "email": recipient_user.email if recipient_user else "unknown@email.com",
                "blocked": recipient_blocked
            },
            "alerts": [{"id": a.id, "code": a.code, "message": a.message, "cleared": a.cleared} for a in alerts]
        })
    
    return {"transactions": result, "total_count": len(result)}

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
async def create_block(payload: BlockIn, db: Session = Depends(get_db)):
    """Create a block on an account (sender or receiver)"""
    # Check if block already exists
    existing_block = db.query(Block).filter(
        Block.block_type == payload.block_type,
        Block.subject_account_id == payload.subject_account_id,
        Block.removed_at.is_(None)
    ).first()
    
    if existing_block:
        return {"ok": True, "id": existing_block.id, "message": "Block already exists"}
    
    b = Block(
        block_type=payload.block_type, 
        subject_account_id=payload.subject_account_id,
        reason=payload.reason, 
        created_at=datetime.now(timezone.utc)
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    
    # Send notification to affected user
    try:
        account = db.query(Account).filter(Account.id == payload.subject_account_id).first()
        if account:
            user = db.query(User).filter(User.id == account.user_id).first()
            if user:
                await notification_manager.notify(
                    user.id,
                    "account_blocked",
                    {
                        "block_type": payload.block_type.value,
                        "reason": payload.reason or "Admin action",
                        "account_id": payload.subject_account_id
                    }
                )
    except Exception as e:
        print(f"Failed to send block notification: {e}")
    
    return {"ok": True, "id": b.id}

@app.post("/api/admin/unblock/{block_id}")
async def remove_block(block_id: int, db: Session = Depends(get_db)):
    """Remove a block by block ID"""
    b = db.query(Block).get(block_id)
    if not b: 
        raise HTTPException(status_code=404, detail="Block not found")
    if b.removed_at is None: 
        b.removed_at = datetime.now(timezone.utc)
        db.commit()
        
        # Send notification to affected user
        try:
            account = db.query(Account).filter(Account.id == b.subject_account_id).first()
            if account:
                user = db.query(User).filter(User.id == account.user_id).first()
                if user:
                    await notification_manager.notify(
                        user.id,
                        "account_unblocked",
                        {
                            "block_type": b.block_type.value,
                            "account_id": b.subject_account_id
                        }
                    )
        except Exception as e:
            print(f"Failed to send unblock notification: {e}")
    
    return {"ok": True}

@app.post("/api/admin/block-account")
async def block_account_by_type(
    account_id: int, 
    block_type: str,
    reason: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Block an account by account_id and block type (SENDER or RECIPIENT)"""
    # Validate block_type
    try:
        block_type_enum = BlockType[block_type.upper()]
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid block_type. Must be SENDER or RECIPIENT")
    
    # Check if an active block already exists
    existing_active_block = db.query(Block).filter(
        Block.block_type == block_type_enum,
        Block.subject_account_id == account_id,
        Block.removed_at.is_(None)
    ).first()
    
    if existing_active_block:
        return {"ok": True, "id": existing_active_block.id, "message": "Block already exists"}
    
    # Check if a removed block exists (due to unique constraint)
    existing_removed_block = db.query(Block).filter(
        Block.block_type == block_type_enum,
        Block.subject_account_id == account_id,
        Block.removed_at.isnot(None)
    ).first()
    
    if existing_removed_block:
        # Reactivate the existing block instead of creating a new one
        existing_removed_block.removed_at = None
        existing_removed_block.reason = reason or "Admin action"
        existing_removed_block.created_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing_removed_block)
        b = existing_removed_block
    else:
        # Create new block
        b = Block(
            block_type=block_type_enum,
            subject_account_id=account_id,
            reason=reason or "Admin action",
            created_at=datetime.now(timezone.utc)
        )
        db.add(b)
        db.commit()
        db.refresh(b)
    
    # Send notification to affected user
    try:
        account = db.query(Account).filter(Account.id == account_id).first()
        if account:
            user = db.query(User).filter(User.id == account.user_id).first()
            if user:
                await notification_manager.notify(
                    user.id,
                    "account_blocked",
                    {
                        "block_type": block_type_enum.value,
                        "reason": reason or "Admin action",
                        "account_id": account_id
                    }
                )
    except Exception as e:
        print(f"Failed to send block notification: {e}")
    
    return {"ok": True, "id": b.id, "block_type": block_type_enum.value}

@app.post("/api/admin/unblock-account")
async def unblock_account_by_type(
    account_id: int,
    block_type: str,
    db: Session = Depends(get_db)
):
    """Unblock an account by account_id and block type"""
    # Validate block_type
    try:
        block_type_enum = BlockType[block_type.upper()]
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid block_type. Must be SENDER or RECIPIENT")
    
    # Find active block
    block = db.query(Block).filter(
        Block.block_type == block_type_enum,
        Block.subject_account_id == account_id,
        Block.removed_at.is_(None)
    ).first()
    
    if not block:
        return {"ok": True, "message": "No active block found"}
    
    # Remove block
    block.removed_at = datetime.now(timezone.utc)
    db.commit()
    
    # Send notification to affected user
    try:
        account = db.query(Account).filter(Account.id == account_id).first()
        if account:
            user = db.query(User).filter(User.id == account.user_id).first()
            if user:
                await notification_manager.notify(
                    user.id,
                    "account_unblocked",
                    {
                        "block_type": block_type_enum.value,
                        "account_id": account_id
                    }
                )
    except Exception as e:
        print(f"Failed to send unblock notification: {e}")
    
    return {"ok": True, "block_id": block.id}

# Helper function to check admin status
def check_admin_user(user_id: int, db: Session) -> bool:
    # Check if user has admin privileges
    user = db.query(User).filter(User.id == user_id).first()
    return user and user.admin

@app.get("/api/admin/export-flagged-payments")
def export_flagged_payments_csv(
    user_id: int, 
    include_cleared: bool = False, 
    db: Session = Depends(get_db)
):
    # Export flagged payments to CSV file. Requires admin privileges
    # Check admin privileges
    if not check_admin_user(user_id, db):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    try:
        csv_content = CSVExportService.export_flagged_payments_simple(db, include_cleared)
        
        # Return CSV as file download
        headers = {
            'Content-Disposition': 'attachment; filename="flagged_payments.csv"',
            'Content-Type': 'text/csv'
        }
        
        return Response(
            content=csv_content,
            media_type='text/csv',
            headers=headers
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export CSV: {str(e)}")

@app.get("/api/admin/export-active-blocks")
def export_active_blocks_csv(
    user_id: int,
    db: Session = Depends(get_db)
):
    # Export active blocks to CSV file. Requires admin privileges
    # Check admin privileges
    if not check_admin_user(user_id, db):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    try:
        csv_content = CSVExportService.export_active_blocks(db)
        
        # Return CSV as file download
        headers = {
            'Content-Disposition': 'attachment; filename="active_blocks.csv"',
            'Content-Type': 'text/csv'
        }
        
        return Response(
            content=csv_content,
            media_type='text/csv', 
            headers=headers
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export CSV: {str(e)}")

@app.post("/api/debug/test-notification/{client_id}")
async def test_notification(client_id: int):
    """Test endpoint to send a test notification"""
    try:
        await notification_manager.notify(
            client_id,
            "test_message",
            {"message": "This is a test notification", "timestamp": datetime.now(timezone.utc).isoformat()}
        )
        return {"status": "sent", "client_id": client_id}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.get("/api/debug/sse-connections")
def debug_sse_connections():
    """Debug endpoint to see current SSE connections"""
    return {
        "subscribers": {str(k): len(v) for k, v in notification_manager.subscribers.items()},
        "total_connections": sum(len(v) for v in notification_manager.subscribers.values())
    }

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


@app.get("/api/beneficiaries/{client_id}")
def list_beneficiaries(client_id: int, db: Session = Depends(get_db)):
    """List beneficiaries for a given user (client_id is user.id)."""
    # Ensure user exists
    user = db.query(User).filter(User.id == client_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    ben_list = db.query(Beneficiary).filter(Beneficiary.owner_user_id == client_id).order_by(Beneficiary.last_used_at.desc()).all()
    out = []
    for b in ben_list:
        out.append({
            "id": b.id,
            "name": b.name,
            "email": b.email,
            "account_id": b.account_id,
            "account_number": b.account_number,
            "nickname": b.nickname,
            "last_used_at": getattr(b.last_used_at, 'isoformat', lambda: None)(),
            "usage_count": b.usage_count or 0,
        })

    return {"beneficiaries": out, "total_count": len(out)}

if __name__ == "__main__":
    import uvicorn
    import os
    from dotenv import load_dotenv

    load_dotenv()
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))

    print(f"Starting server on {host}:{port}")
    
    # Run with uvicorn directly and handle shutdown more gracefully
    try:
        uvicorn.run(
            app, 
            host=host, 
            port=port,
            access_log=True,
            log_level="info",
            timeout_keep_alive=2,
            timeout_graceful_shutdown=1
        )
    except KeyboardInterrupt:
        print("Server shutdown complete.")
    except Exception as e:
        print(f"Server error: {e}")
    finally:
        print("Cleanup finished.")
