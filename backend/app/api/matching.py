from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database.connection import get_db
from app.services.matching_service import search_candidates

router = APIRouter(prefix="/api/matching", tags=["matching"])


class MatchingRequest(BaseModel):
    role: Optional[str] = None
    skills: Optional[list[str]] = None
    min_experience: Optional[int] = None
    max_experience: Optional[int] = None
    location: Optional[str] = None
    query: Optional[str] = None


@router.post("/search")
def search(request: MatchingRequest, db: Session = Depends(get_db)):
    return search_candidates(
        db=db,
        role=request.role,
        skills=request.skills,
        min_experience=request.min_experience,
        max_experience=request.max_experience,
        location=request.location,
        query=request.query,
    )
