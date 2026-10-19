from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.database.connection import Base
import enum


class PortfolioType(str, enum.Enum):
    walk = "walk"
    sketch = "sketch"
    design = "design"
    stitching = "stitching"
    other = "other"


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # image, video
    category = Column(String, nullable=False)   # walk, sketch, design, stitching, other

    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
