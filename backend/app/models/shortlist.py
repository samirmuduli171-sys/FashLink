from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from app.database.connection import Base


class Shortlist(Base):
    __tablename__ = "shortlists"
    __table_args__ = (
        UniqueConstraint("recruiter_id", "talent_id", name="uq_shortlist_pair"),
    )

    id = Column(Integer, primary_key=True, index=True)
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    talent_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
