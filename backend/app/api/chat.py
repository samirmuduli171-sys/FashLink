from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from typing import List

from app.database.connection import get_db, SessionLocal
from app.models.user import User
from app.models.chat import Message
from app.models.schemas import MessageOut, ConversationOut
from app.utils.dependencies import get_current_user
from app.utils.auth_utils import decode_access_token
from app.utils.ws_manager import manager
from app.models.notification import Notification

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.get("/conversations", response_model=List[ConversationOut])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    messages = (
        db.query(Message)
        .filter(
            or_(
                Message.sender_id == current_user.id,
                Message.receiver_id == current_user.id,
            )
        )
        .order_by(desc(Message.created_at))
        .all()
    )

    seen = {}
    for m in messages:
        other_id = m.receiver_id if m.sender_id == current_user.id else m.sender_id
        if other_id not in seen:
            unread = sum(
                1 for x in messages
                if x.sender_id == other_id
                and x.receiver_id == current_user.id
                and not x.is_read
            )
            other_user = db.query(User).filter(User.id == other_id).first()
            if other_user:
                seen[other_id] = ConversationOut(
                    user_id=other_user.id,
                    username=other_user.username,
                    full_name=other_user.full_name,
                    profile_picture=other_user.profile_picture,
                    last_message=m.content,
                    last_message_at=m.created_at.isoformat() if m.created_at else None,
                    unread_count=unread,
                )

    return list(seen.values())


@router.get("/messages/{other_user_id}", response_model=List[MessageOut])
def get_message_history(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    messages = (
        db.query(Message)
        .filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == other_user_id),
                and_(Message.sender_id == other_user_id, Message.receiver_id == current_user.id),
            )
        )
        .order_by(Message.created_at)
        .all()
    )

    for m in messages:
        if m.receiver_id == current_user.id and not m.is_read:
            m.is_read = True
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.actor_id == other_user_id,
        Notification.type == "message",
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()

    return [
        MessageOut(
            id=m.id,
            sender_id=m.sender_id,
            receiver_id=m.receiver_id,
            content=m.content,
            is_read=m.is_read,
            created_at=m.created_at.isoformat() if m.created_at else None,
        )
        for m in messages
    ]


@router.websocket("/ws")
async def chat_websocket(websocket: WebSocket, token: str = Query(...)):
    payload = decode_access_token(token)
    if payload is None:
        await websocket.close(code=4001)
        return

    user_id = int(payload.get("sub"))
    await manager.connect(user_id, websocket)

    db = SessionLocal()
    try:
        while True:
            data = await websocket.receive_json()
            receiver_id = int(data["receiver_id"])
            content = data["content"]

            message = Message(sender_id=user_id, receiver_id=receiver_id, content=content)
            db.add(message)
            db.commit()
            db.refresh(message)

            sender = db.query(User).filter(User.id == user_id).first()
            existing = (
                db.query(Notification)
                .filter(
                    Notification.user_id == receiver_id,
                    Notification.actor_id == user_id,
                    Notification.type == "message",
                    Notification.is_read == False,
                )
                .first()
            )
            if not existing and sender:
                db.add(
                    Notification(
                        user_id=receiver_id,
                        actor_id=user_id,
                        type="message",
                        text=f"New message from {sender.full_name or sender.username}",
                        link=f"/messages/{user_id}?username={sender.username}",
                    )
                )
                db.commit()

            payload_out = {
                "id": message.id,
                "sender_id": message.sender_id,
                "receiver_id": message.receiver_id,
                "content": message.content,
                "is_read": message.is_read,
                "created_at": message.created_at.isoformat() if message.created_at else None,
            }

            await manager.send_to_user(user_id, payload_out)
            await manager.send_to_user(receiver_id, payload_out)

    except WebSocketDisconnect:
        manager.disconnect(user_id)
    finally:
        db.close()
