from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database.connection import Base, engine
from app.models import user, portfolio, analysis, rating, chat, notification, pending_registration, shortlist, job
from app.api import auth, portfolio as portfolio_router, analysis as analysis_router, profile as profile_router, rating as rating_router, matching as matching_router, chat as chat_router, notifications as notifications_router, shortlist as shortlist_router, jobs as jobs_router

app = FastAPI(title="FashLink API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(portfolio_router.router)
app.include_router(analysis_router.router)
app.include_router(profile_router.router)
app.include_router(rating_router.router)
app.include_router(matching_router.router)
app.include_router(chat_router.router)
app.include_router(notifications_router.router)
app.include_router(shortlist_router.router)
app.include_router(jobs_router.router)


@app.get("/")
def root():
    return {"status": "FashLink API running"}
