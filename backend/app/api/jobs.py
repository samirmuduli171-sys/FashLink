from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.connection import get_db
from app.models.user import User
from app.models.job import Job, JobApplication
from app.models.notification import Notification
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

ROLES_NEEDED = {"any", "model", "designer"}
JOB_TYPES = {"full-time", "part-time", "freelance", "contract"}
STATUSES = {"applied", "shortlisted", "rejected"}


class JobCreate(BaseModel):
    title: str
    description: str
    role_needed: str = "any"
    location: Optional[str] = None
    skills: Optional[str] = None
    job_type: str = "full-time"


class ApplyRequest(BaseModel):
    message: Optional[str] = None


class StatusUpdate(BaseModel):
    status: str


def _role(user: User) -> str:
    return getattr(user.role, "value", user.role)


def _require_recruiter(user: User):
    if _role(user) != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can do this")


def _own_job(db: Session, job_id: int, user: User) -> Job:
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.recruiter_id != user.id:
        raise HTTPException(status_code=403, detail="This is not your job posting")
    return job


def _job_out(job: Job, db: Session, me: User):
    recruiter = db.query(User).filter(User.id == job.recruiter_id).first()
    count = db.query(JobApplication).filter(JobApplication.job_id == job.id).count()
    mine = (
        db.query(JobApplication)
        .filter(JobApplication.job_id == job.id, JobApplication.applicant_id == me.id)
        .first()
    )
    return {
        "id": job.id,
        "title": job.title,
        "description": job.description,
        "role_needed": job.role_needed,
        "location": job.location,
        "skills": job.skills,
        "job_type": job.job_type,
        "is_open": job.is_open,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "recruiter_username": recruiter.username if recruiter else "",
        "recruiter_name": (recruiter.full_name or recruiter.username) if recruiter else "",
        "company_name": recruiter.company_name if recruiter else None,
        "applicant_count": count,
        "applied": mine is not None,
        "my_status": mine.status if mine else None,
    }


@router.post("")
def create_job(
    data: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_recruiter(current_user)
    title = data.title.strip()
    description = data.description.strip()
    if len(title) < 3 or len(title) > 100:
        raise HTTPException(status_code=400, detail="Title must be 3-100 characters")
    if len(description) < 10:
        raise HTTPException(status_code=400, detail="Please add a longer description")
    if data.role_needed not in ROLES_NEEDED:
        raise HTTPException(status_code=400, detail="Invalid role")
    if data.job_type not in JOB_TYPES:
        raise HTTPException(status_code=400, detail="Invalid job type")

    job = Job(
        recruiter_id=current_user.id,
        title=title,
        description=description,
        role_needed=data.role_needed,
        location=(data.location or "").strip() or None,
        skills=(data.skills or "").strip() or None,
        job_type=data.job_type,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return _job_out(job, db, current_user)


@router.get("")
def list_jobs(
    role: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Job).filter(Job.is_open == True)
    if role in ("model", "designer"):
        query = query.filter(Job.role_needed.in_([role, "any"]))
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(
            Job.title.ilike(like) | Job.skills.ilike(like) | Job.location.ilike(like)
        )
    jobs = query.order_by(desc(Job.created_at)).all()
    return [_job_out(j, db, current_user) for j in jobs]


@router.get("/mine")
def my_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_recruiter(current_user)
    jobs = (
        db.query(Job)
        .filter(Job.recruiter_id == current_user.id)
        .order_by(desc(Job.created_at))
        .all()
    )
    return [_job_out(j, db, current_user) for j in jobs]


@router.get("/{job_id}/applicants")
def job_applicants(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_recruiter(current_user)
    _own_job(db, job_id, current_user)
    apps = (
        db.query(JobApplication)
        .filter(JobApplication.job_id == job_id)
        .order_by(desc(JobApplication.created_at))
        .all()
    )
    out = []
    for a in apps:
        u = db.query(User).filter(User.id == a.applicant_id).first()
        if not u:
            continue
        out.append(
            {
                "application_id": a.id,
                "status": a.status,
                "message": a.message,
                "applied_at": a.created_at.isoformat() if a.created_at else None,
                "id": u.id,
                "username": u.username,
                "full_name": u.full_name,
                "role": _role(u),
                "skills": u.skills,
                "location": u.location,
                "profile_picture": u.profile_picture,
                "ai_rating": u.ai_rating,
            }
        )
    return out


@router.post("/{job_id}/apply")
def apply_to_job(
    job_id: int,
    data: ApplyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    my_role = _role(current_user)
    if my_role not in ("model", "designer"):
        raise HTTPException(status_code=403, detail="Only models and designers can apply")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not job.is_open:
        raise HTTPException(status_code=400, detail="This job is closed")
    if job.role_needed not in ("any", my_role):
        raise HTTPException(
            status_code=400, detail=f"This job is only for {job.role_needed}s"
        )

    existing = (
        db.query(JobApplication)
        .filter(
            JobApplication.job_id == job_id,
            JobApplication.applicant_id == current_user.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You already applied to this job")

    db.add(
        JobApplication(
            job_id=job_id,
            applicant_id=current_user.id,
            message=(data.message or "").strip() or None,
        )
    )
    db.add(
        Notification(
            user_id=job.recruiter_id,
            actor_id=current_user.id,
            type="application",
            text=f"{current_user.full_name or current_user.username} applied to {job.title}",
            link="/jobs/manage",
        )
    )
    db.commit()
    return {"applied": True}


@router.patch("/applications/{application_id}")
def update_application_status(
    application_id: int,
    data: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_recruiter(current_user)
    if data.status not in STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")

    app_row = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found")
    job = _own_job(db, app_row.job_id, current_user)

    changed = app_row.status != data.status
    app_row.status = data.status

    if changed and data.status in ("shortlisted", "rejected"):
        text = (
            f"You were shortlisted for {job.title}"
            if data.status == "shortlisted"
            else f"Update on your application for {job.title}"
        )
        db.add(
            Notification(
                user_id=app_row.applicant_id,
                actor_id=current_user.id,
                type="application_status",
                text=text,
                link="/jobs",
            )
        )
    db.commit()
    return {"status": app_row.status}


@router.post("/{job_id}/toggle-open")
def toggle_job_open(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_recruiter(current_user)
    job = _own_job(db, job_id, current_user)
    job.is_open = not job.is_open
    db.commit()
    return {"is_open": job.is_open}
