from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.database.connection import get_db
from app.models.user import User
from app.models.rating import Rating
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/rating", tags=["rating"])


class RatingIn(BaseModel):
    stars: int = Field(..., ge=1, le=5)


@router.post("/{username}")
def rate_user(
    username: str,
    rating_data: RatingIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rated_user = db.query(User).filter(User.username == username).first()
    if not rated_user:
        raise HTTPException(status_code=404, detail="User not found")

    if rated_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot rate yourself")

    existing = db.query(Rating).filter(
        Rating.rated_user_id == rated_user.id,
        Rating.rater_user_id == current_user.id,
    ).first()

    if existing:
        existing.stars = rating_data.stars
    else:
        new_rating = Rating(
            rated_user_id=rated_user.id,
            rater_user_id=current_user.id,
            stars=rating_data.stars,
        )
        db.add(new_rating)

    db.commit()

    all_ratings = db.query(Rating).filter(Rating.rated_user_id == rated_user.id).all()
    avg_rating = sum(r.stars for r in all_ratings) / len(all_ratings)
    rated_user.peer_rating = round(avg_rating, 1)
    db.commit()

    return {"peer_rating": rated_user.peer_rating, "total_ratings": len(all_ratings)}
