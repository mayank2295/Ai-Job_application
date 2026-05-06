# JobFlow AI

> **Recommended repository name:** `jobflow-ai`
>
> **Recommended description:** *AI-powered hiring platform for candidates and recruiters — cover letter generation, ATS resume scoring, mock interviews, skill badges and CareerBot. React 19 · Node.js · TypeScript · PostgreSQL.*

---

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-latest-4169E1?logo=postgresql&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase&logoColor=black)
![GPT-4o-mini](https://img.shields.io/badge/AI-GPT--4o--mini-412991?logo=openai&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=black)

An AI-powered hiring platform for candidates and recruiters — built with React 19, Node.js, TypeScript, and PostgreSQL.

**Live:**
- Frontend: https://ai-job-application-eight.vercel.app
- Backend API: https://ai-job-application-1.onrender.com/api
- Health check: https://ai-job-application-1.onrender.com/api/health

---

## What it does

**For Candidates**
- Browse job listings and apply with resume upload + AI cover letter generation
- Track application status with real-time in-app notifications
- AI Chat (CareerBot) — web search, career advice, course finder
- ATS Resume Analyzer — scores your resume against job descriptions
- Mock Interview — 10 hard questions, per-answer feedback, CV enhancement tips
- Skill Assessment — 10-question quizzes, verified skill badges on profile
- LinkedIn Optimizer — AI-generated headline, about section, and tips
- Course Finder — Udemy & Coursera results via Tavily search

**For Admins**
- Dashboard with application stats and recent activity
- Applications table with search, filter by status, and pagination
- Kanban board — drag and drop candidates across pipeline stages
- Manage jobs (create, edit, toggle active)
- Manage users
- All AI tools available to admins too

---

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite, Framer Motion |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (Render external) |
| Auth | Firebase (Google + email/password) |
| AI | OpenRouter (GPT-4o-mini) + Tavily Search |
| Deploy | Vercel (frontend) + Render (backend) |

---

## Run locally

**Backend**
```bash
cd backend
cp .env.example .env   # fill in your values
npm install
npm run dev
```

**Frontend**
```bash
cd frontend
cp .env.example .env   # fill in your values
npm install
npm run dev
```

Local URLs:
- Frontend: http://localhost:5174
- Backend: http://localhost:3001

---

## Environment variables

**Backend** (`backend/.env`)
```
PORT=3001
DATABASE_URL=postgresql://...
DATABASE_SSL=true
OPENROUTER_API_KEY=sk-or-v1-...
TAVILY_API_KEY=tvly-...
OPENROUTER_MODEL=openai/gpt-4o-mini
FRONTEND_URL=http://localhost:5174
```

**Frontend** (`frontend/.env`)
```
VITE_API_BASE_URL=https://ai-job-application-1.onrender.com/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Never commit `.env` files. Set real values in Vercel and Render dashboards.

---

## Deploy

**Render (backend)**
- Root directory: `backend`
- Build: `npm ci && npm run build`
- Start: `npm start`
- Node: `20.x`

**Vercel (frontend)**
- Root directory: `frontend`
- Build: `npm run build`
- Output: `dist`
- Set `VITE_API_BASE_URL` in Vercel environment variables

---

## Project structure

```
├── frontend/          React + TypeScript (Vite)
│   └── src/
│       ├── components/   Sidebar, Navbar, NotificationBell, CareerBot, HelpBot...
│       ├── pages/        All route pages
│       ├── context/      AuthContext, ThemeContext
│       ├── api/          API client
│       └── lib/          careerbot-api.js, firebase.ts
│
└── backend/           Node.js + Express + TypeScript
    └── src/
        ├── routes/       applications, jobs, users, admin, careerbot, aiFeatures...
        ├── database/     db.ts (pg pool), schema.sql
        └── services/     emailService, powerAutomate, azureBlobStorage
```

---

## GitHub Topics

Add the following topics to this repository for better discoverability:

`typescript` `react` `nodejs` `postgresql` `firebase` `ai` `gpt-4` `job-search` `hiring-platform` `ats` `resume-analyzer` `career-tools` `openai` `tavily` `full-stack`
