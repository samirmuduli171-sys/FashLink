# FashLink

FashLink is a platform that connects fashion talent (models and designers) with recruiters. Talent upload their portfolio and get an AI-generated score. Recruiters search for people, message them, shortlist them and post jobs.

## Features

- **Accounts with email verification**: sign up as a model, designer or recruiter. A 6-digit code is emailed and must be entered before the account is created.
- **Portfolio upload**: photos and videos of walks, sketches and designs.
- **AI portfolio analysis**: each upload gets a score and a report (pose detection for walks, and models for designs, sketches and stitching), plus an overall profile rating.
- **Discover and matching**: search by name, role, skills and location, ranked by a match score.
- **Ratings**: users can rate each other, which gives a peer rating.
- **Real-time chat**: instant messaging between users over WebSockets, with a conversation list and unread counts.
- **Notifications**: a bell with unread count for new messages, shortlists, job applications and application updates.
- **Recruiter shortlist**: recruiters save talent to a private list.
- **Job postings**: recruiters post openings, models and designers apply with a note, and recruiters shortlist or reject applicants.
- **Content protection**: on other people's profiles, portfolio photos and videos go black when a screenshot shortcut is used or the window loses focus, and right-click save is disabled. This is a best-effort deterrent, since no website can fully block screenshots.

## Tech stack

- **Backend**: Python, FastAPI, SQLAlchemy, SQLite, WebSockets, JWT login
- **AI**: YOLOv8 pose model and CNN models (PyTorch)
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Email**: Gmail SMTP

## Project structure

    FashLink/
      backend/    FastAPI app (app/api, app/models, app/services, app/utils)
      frontend/   Next.js app (src/app pages, src/components, src/lib/api.ts)

## How to run

You need Python 3.10 or newer and Node.js 18 or newer.

### 1. Backend

    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt

Create a file named `.env` inside the `backend` folder:

    SECRET_KEY=any-long-random-string
    EMAIL_USER=your-sender-gmail@gmail.com
    EMAIL_APP_PASSWORD=your-gmail-app-password-with-no-spaces

`EMAIL_APP_PASSWORD` is a Gmail app password (Google Account, Security, 2-Step Verification, App passwords). If `EMAIL_USER` and `EMAIL_APP_PASSWORD` are left out, the verification code is printed in the backend terminal instead of being emailed, which is fine for local testing.

Start the server:

    uvicorn app.main:app --reload

The API runs at http://127.0.0.1:8000 and the API docs are at http://127.0.0.1:8000/docs.

### 2. Frontend

In a second terminal:

    cd frontend
    npm install
    npm run dev

Open http://localhost:3000.

Start the backend first, otherwise the pages show "Failed to fetch".

## Notes

- The database (`fashlink.db`) and uploaded files are created locally and are not part of the repository.
- Usernames can use letters, numbers, `_`, `.` and `-` (3 to 30 characters).
- Gmail limits how many emails an account can send per day, so a production version should use a proper email service.
