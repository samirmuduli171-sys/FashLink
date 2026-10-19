from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.user import User, UserRole
from app.models.portfolio import Portfolio


def search_candidates(
    db: Session,
    role: str = None,
    skills: list[str] = None,
    min_experience: int = None,
    max_experience: int = None,
    location: str = None,
    query: str = None,
):
    base_query = db.query(User)

    if query:
        like = f"%{query}%"
        base_query = base_query.filter(
            or_(
                User.username.ilike(like),
                User.full_name.ilike(like),
                User.company_name.ilike(like),
            )
        )
    else:
        base_query = base_query.filter(User.role != UserRole.recruiter)

    if role:
        base_query = base_query.filter(User.role == role)
    if location:
        base_query = base_query.filter(User.location.ilike(f"%{location}%"))
    if min_experience is not None:
        base_query = base_query.filter(User.experience_years >= min_experience)
    if max_experience is not None:
        base_query = base_query.filter(User.experience_years <= max_experience)

    candidates = base_query.all()

    requested_skills = set(s.strip().lower() for s in (skills or []))

    results = []
    for candidate in candidates:
        candidate_skills = set(
            s.strip().lower() for s in (candidate.skills or "").split(",") if s.strip()
        )

        weighted_sum = 0.0
        total_weight = 0.0

        # Quality component — always counted, based on the candidate's own AI rating.
        # This is what keeps results from all defaulting to 100%.
        quality = (candidate.ai_rating or 0) / 100
        weighted_sum += quality * 30
        total_weight += 30

        if requested_skills:
            overlap = candidate_skills.intersection(requested_skills)
            skill_score = len(overlap) / len(requested_skills)
            weighted_sum += skill_score * 40
            total_weight += 40

        if location:
            weighted_sum += 1.0 * 15
            total_weight += 15

        if min_experience is not None or max_experience is not None:
            weighted_sum += 1.0 * 15
            total_weight += 15

        match_score = round((weighted_sum / total_weight) * 100) if total_weight > 0 else 0

        thumbnail = (
            db.query(Portfolio)
            .filter(Portfolio.user_id == candidate.id, Portfolio.file_type == "image")
            .order_by(Portfolio.created_at.desc())
            .first()
        )

        results.append({
            "id": candidate.id,
            "username": candidate.username,
            "full_name": candidate.full_name,
            "role": candidate.role,
            "skills": candidate.skills,
            "experience_years": candidate.experience_years,
            "location": candidate.location,
            "company_name": candidate.company_name,
            "profile_picture": candidate.profile_picture,
            "ai_rating": candidate.ai_rating,
            "peer_rating": candidate.peer_rating,
            "match_score": match_score,
            "thumbnail_path": thumbnail.file_path if thumbnail else None,
        })

    results.sort(key=lambda r: r["match_score"], reverse=True)
    return results
