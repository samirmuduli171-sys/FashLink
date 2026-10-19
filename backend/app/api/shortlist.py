from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.connection import get_db
from app.models.user import User
from app.models.shortlist import Shortlist
from app.models.notification import Notification
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/shortlist", tags=["shortlist"])


def _role(user: User) -> str:
    return getattr(user.role, "value", user.role)


def _require_recruiter(user: User):
    if _role(user) != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can use the shortlist")


@router.get("")
def list_shortlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_recruiter(current_user)
    rows = (
        db.query(Shortlist)
        .filter(Shortlist.recruiter_id == current_user.id)
        .order_by(desc(Shortlist.created_at))
        .all()
    )
    out = []
    for r in rows:
        t = db.query(User).filter(User.id == r.talent_id).first()
        if t:
            out.append(
                {
                    "id": t.id,
                    "username": t.username,
                    "full_name": t.full_name,
                    "role": _role(t),
                    "skills": t.skills,
                    "location": t.location,
                    "experience_years": t.experience_years,
                    "profile_picture": t.profile_picture,
                    "ai_rating": t.ai_rating,
                    "peer_rating": t.peer_rating,
                }
            )
    return out


@router.get("/usernames")
def shortlisted_usernames(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_recruiter(current_user)
    rows = db.query(Shortlist).filter(Shortlist.recruiter_id == current_user.id).all()
    names = []
    for r in rows:
        t = db.query(User).filter(User.id == r.talent_id).first()
        if t:
            names.append(t.username)
    return names


@router.post("/{username}")
def add_to_shortlist(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_recruiter(current_user)
    talent = db.query(User).filter(User.username == username).first()
    if not talent:
        raise HTTPException(status_code=404, detail="User not found")
    if _role(talent) == "recruiter":
        raise HTTPException(status_code=400, detail="You can only shortlist models and designers")

    existing = (
        db.query(Shortlist)
        .filter(Shortlist.recruiter_id == current_user.id, Shortlist.talent_id == talent.id)
        .first()
    )
    if existing:
        return {"shortlisted": True}

    db.add(Shortlist(recruiter_id=current_user.id, talent_id=talent.id))
    db.add(
        Notification(
            user_id=talent.id,
            actor_id=current_user.id,
            type="shortlist",
            text=f"{current_user.full_name or current_user.username} shortlisted you",
            link=f"/profile/{current_user.username}",
        )
    )
    db.commit()
    return {"shortlisted": True}


@router.delete("/{username}")
def remove_from_shortlist(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_recruiter(current_user)
    talent = db.query(User).filter(User.username == username).first()
    if not talent:
        raise HTTPException(status_code=404, detail="User not found")
    db.query(Shortlist).filter(
        Shortlist.recruiter_id == current_user.id, Shortlist.talent_id == talent.id
    ).delete()
    db.commit()
    return {"shortlisted": False}
