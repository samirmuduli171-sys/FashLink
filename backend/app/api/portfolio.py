from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database.connection import get_db
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.schemas import PortfolioOut
from app.utils.dependencies import get_current_user
from app.utils.file_handler import save_upload_file

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


@router.post("/upload", response_model=PortfolioOut)
def upload_portfolio_item(
    category: str = Form(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        file_path, file_type = save_upload_file(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    new_item = Portfolio(
        user_id=current_user.id,
        file_path=file_path,
        file_type=file_type,
        category=category,
        title=title,
        description=description,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return new_item


@router.get("/my-portfolio", response_model=list[PortfolioOut])
def get_my_portfolio(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Portfolio).filter(Portfolio.user_id == current_user.id).all()
