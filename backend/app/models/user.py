from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean, Text
from sqlalchemy.sql import func
from app.database.connection import Base
import enum


class UserRole(str, enum.Enum):
    model = "model"
    designer = "designer"
    recruiter = "recruiter"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(Enum(UserRole), nullable=False)
    bio = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)

    skills = Column(String, nullable=True)
    experience_years = Column(Integer, nullable=True)
    location = Column(String, nullable=True)

    company_name = Column(String, nullable=True)
    hiring_roles = Column(String, nullable=True)

    phone_number = Column(String, nullable=True)
    address = Column(String, nullable=True)

    ai_rating = Column(Integer, default=0)
    ai_report_text = Column(Text, nullable=True)
    ai_suggestion_text = Column(Text, nullable=True)
    peer_rating = Column(Integer, default=0)

    is_report_visible = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
