from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from app.database.connection import Base


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    rated_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)   # who is being rated
    rater_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)   # who is giving the rating
    stars = Column(Integer, nullable=False)  # 1 to 5

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("rated_user_id", "rater_user_id", name="one_rating_per_user_pair"),
    )
