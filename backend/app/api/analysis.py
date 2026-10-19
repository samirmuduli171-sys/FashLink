from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.analysis import Analysis
from app.models.schemas import AnalysisOut
from app.utils.dependencies import get_current_user
from app.services.scoring_service import analyze_portfolio_item

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.post("/run/{portfolio_id}", response_model=AnalysisOut)
def run_analysis(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id,
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")

    score, report_text, overlay_path, overlay_video_path = analyze_portfolio_item(item.category, item.file_type, item.file_path)

    analysis = Analysis(
        portfolio_id=item.id,
        user_id=current_user.id,
        score=score,
        report_text=report_text,
        overlay_path=overlay_path,
        overlay_video_path=overlay_video_path,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    # update user's overall AI rating (simple running average for now)
    all_scores = db.query(Analysis).filter(Analysis.user_id == current_user.id).all()
    avg_score = sum(a.score for a in all_scores) / len(all_scores)
    current_user.ai_rating = round(avg_score)
    db.commit()

    return analysis


@router.get("/portfolio/{portfolio_id}", response_model=list[AnalysisOut])
def get_analysis_for_item(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Analysis).filter(
        Analysis.portfolio_id == portfolio_id,
        Analysis.user_id == current_user.id,
    ).all()


@router.post("/run-profile")
def run_profile_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    all_analyses = db.query(Analysis).filter(Analysis.user_id == current_user.id).all()

    if not all_analyses:
        raise HTTPException(
            status_code=400,
            detail="Upload and analyze at least one portfolio item first",
        )

    portfolio_items = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).all()
    portfolio_by_id = {item.id: item for item in portfolio_items}

    by_category: dict[str, list[float]] = {}
    for a in all_analyses:
        item = portfolio_by_id.get(a.portfolio_id)
        if not item:
            continue
        by_category.setdefault(item.category, []).append(a.score)

    avg_score = sum(a.score for a in all_analyses) / len(all_analyses)
    rating_out_of_10 = round(avg_score / 10, 1)

    def label(cat_avg: float) -> str:
        if cat_avg >= 85:
            return "excellent"
        elif cat_avg >= 70:
            return "solid"
        elif cat_avg >= 55:
            return "developing"
        return "needs work"

    lines = []
    for category in sorted(by_category.keys()):
        scores = by_category[category]
        cat_avg = round(sum(scores) / len(scores), 1)
        cat_out_of_10 = round(cat_avg / 10, 1)
        lines.append(
            f"{category.capitalize()}: {cat_out_of_10}/10 across {len(scores)} piece(s) — {label(cat_avg)}."
        )

    breakdown = " ".join(lines)
    summary = (
        f"Overall score {rating_out_of_10}/10 based on {len(all_analyses)} analyzed "
        f"piece(s) across {len(by_category)} categor{'y' if len(by_category) == 1 else 'ies'}."
    )
    report_text = f"{summary} {breakdown}"

    # Build improvement suggestions
    suggestions = []

    all_categories = {"walk", "sketch", "design", "stitching"}
    missing = all_categories - set(by_category.keys())
    if missing:
        missing_list = ", ".join(sorted(missing))
        suggestions.append(
            f"Add {missing_list} to your portfolio — showing range across more categories improves your overall profile strength."
        )

    weak_categories = [
        cat for cat, scores in by_category.items()
        if (sum(scores) / len(scores)) < 65
    ]
    if weak_categories:
        weak_list = ", ".join(sorted(weak_categories))
        suggestions.append(
            f"Your {weak_list} score is below average — try uploading a sharper, better-lit piece in this category to improve it."
        )

    thin_categories = [cat for cat, scores in by_category.items() if len(scores) == 1]
    if thin_categories:
        thin_list = ", ".join(sorted(thin_categories))
        suggestions.append(
            f"You only have one piece under {thin_list} — adding more samples gives a fuller, more reliable picture of your work."
        )

    if not current_user.bio or len(current_user.bio.strip()) < 20:
        suggestions.append(
            "Your bio is short or missing — a fuller bio helps recruiters understand your style and background."
        )

    if not current_user.skills:
        suggestions.append(
            "Add your skills to your profile — recruiters search by skill, and an empty skills list means you won't show up in relevant results."
        )

    if not suggestions:
        suggestions.append(
            "Strong, well-rounded portfolio — keep uploading regularly to stay visible in recruiter searches."
        )

    suggestion_text = " ".join(suggestions)

    current_user.ai_rating = round(avg_score)
    current_user.ai_report_text = report_text
    current_user.ai_suggestion_text = suggestion_text
    db.commit()

    return {
        "rating_out_of_10": rating_out_of_10,
        "report_text": report_text,
        "suggestion_text": suggestion_text,
        "breakdown": [
            {
                "category": cat,
                "average_score": round(sum(scores) / len(scores), 1),
                "rating_out_of_10": round(sum(scores) / len(scores) / 10, 1),
                "count": len(scores),
            }
            for cat, scores in sorted(by_category.items())
        ],
    }
