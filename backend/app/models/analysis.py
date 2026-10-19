from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.sql import func
from app.database.connection import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    score = Column(Float, nullable=False)
    report_text = Column(Text, nullable=False)
    overlay_path = Column(String, nullable=True)
    overlay_video_path = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
