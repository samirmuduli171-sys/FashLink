from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import UserRole


class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: UserRole


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    bio: Optional[str] = None
    skills: Optional[str] = None
    experience_years: Optional[int] = None
    location: Optional[str] = None
    company_name: Optional[str] = None
    hiring_roles: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    role: UserRole
    bio: Optional[str] = None
    profile_picture: Optional[str] = None
    skills: Optional[str] = None
    experience_years: Optional[int] = None
    location: Optional[str] = None
    company_name: Optional[str] = None
    hiring_roles: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    ai_rating: int
    ai_report_text: Optional[str] = None
    ai_suggestion_text: Optional[str] = None
    peer_rating: int
    is_report_visible: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PortfolioOut(BaseModel):
    id: int
    user_id: int
    file_path: str
    file_type: str
    category: str
    title: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class AnalysisOut(BaseModel):
    id: int
    portfolio_id: int
    user_id: int
    score: float
    report_text: str
    overlay_path: Optional[str] = None
    overlay_video_path: Optional[str] = None

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    receiver_id: int
    content: str


class MessageOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    is_read: bool
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    user_id: int
    username: str
    full_name: Optional[str] = None
    profile_picture: Optional[str] = None
    last_message: Optional[str] = None
    last_message_at: Optional[str] = None
    unread_count: int = 0


class VerifyEmailRequest(BaseModel):
    email: str
    code: str


class ResendCodeRequest(BaseModel):
    email: str
