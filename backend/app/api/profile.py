from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.analysis import Analysis
from app.models.schemas import UserOut, PortfolioOut, AnalysisOut, UserUpdate
from app.utils.dependencies import get_current_user
from app.utils.file_handler import save_upload_file
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/profile", tags=["profile"])


class ProfileOut(BaseModel):
    user: UserOut
    portfolio: list[PortfolioOut]
    reports: list[AnalysisOut]


@router.get("/{username}", response_model=ProfileOut)
def get_profile(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    portfolio_items = db.query(Portfolio).filter(Portfolio.user_id == user.id).all()

    reports = []
    if user.is_report_visible:
        portfolio_ids = [item.id for item in portfolio_items]
        reports = db.query(Analysis).filter(Analysis.portfolio_id.in_(portfolio_ids)).all()

    return ProfileOut(user=user, portfolio=portfolio_items, reports=reports)


@router.patch("/toggle-report-visibility")
def toggle_report_visibility(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.is_report_visible = not current_user.is_report_visible
    db.commit()
    return {"is_report_visible": current_user.is_report_visible}


@router.patch("/me/update", response_model=UserOut)
def update_my_profile(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if update_data.bio is not None:
        current_user.bio = update_data.bio
    if update_data.skills is not None:
        current_user.skills = update_data.skills
    if update_data.experience_years is not None:
        current_user.experience_years = update_data.experience_years
    if update_data.location is not None:
        current_user.location = update_data.location
    if update_data.company_name is not None:
        current_user.company_name = update_data.company_name
    if update_data.hiring_roles is not None:
        current_user.hiring_roles = update_data.hiring_roles
    if update_data.phone_number is not None:
        current_user.phone_number = update_data.phone_number
    if update_data.address is not None:
        current_user.address = update_data.address

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/me/info", response_model=UserOut)
def get_my_info(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/me/upload-picture", response_model=UserOut)
def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        file_path, file_type = save_upload_file(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if file_type != "image":
        raise HTTPException(status_code=400, detail="Profile picture must be an image")

    current_user.profile_picture = file_path
    db.commit()
    db.refresh(current_user)
    return current_user
