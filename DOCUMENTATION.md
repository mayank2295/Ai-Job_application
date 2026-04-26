# JobFlow AI — Complete Project Documentation

**Live URLs**
- Frontend: https://ai-job-application-eight.vercel.app
- Backend API: https://ai-job-application-1.onrender.com/api
- Health: https://ai-job-application-1.onrender.com/api/health

---

## Overview

JobFlow AI is a full-stack AI-powered hiring platform with two portals:
- **Admin Portal** — recruiters manage jobs, applications, candidates, and AI analysis
- **Candidate Portal** — job seekers browse jobs, apply, track applications, and use AI career tools

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Custom CSS design system (dark/light mode) |
| Animations | Framer Motion |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (Render external) |
| Auth | Firebase (Google + email/password) |
| AI/LLM | OpenRouter API (GPT-4o-mini) |
| Web Search | Tavily Search API |
| File Storage | Cloudinary (resume PDFs) |
| PDF Parsing | pdfjs-dist (client-side) |
| Automation | n8n webhook (email notifications) |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

---

## Project Structure

```
├── frontend/                  React + TypeScript (Vite)
│   └── src/
│       ├── components/        Reusable UI components
│       │   ├── Sidebar.tsx    Navigation sidebar
│       │   ├── Navbar.tsx     Top header with notifications
│       │   ├── NotificationBell.tsx  Real-time notification bell
│       │   ├── CareerBot.jsx  AI chat + ATS + courses component
│       │   ├── HelpBot.tsx    Floating help assistant
│       │   ├── WebSearchTab.tsx  Web search UI
│       │   ├── ThemeToggle.tsx   Dark/light mode toggle
│       │   └── ProtectedRoute.tsx  Auth guard
│       ├── pages/             Route pages
│       ├── context/           AuthContext, ThemeContext
│       ├── api/               client.ts (API wrapper)
│       └── lib/               careerbot-api.js, firebase.ts
│
└── backend/                   Node.js + Express + TypeScript
    └── src/
        ├── routes/            All API route handlers
        ├── database/          db.ts (pg pool), schema.sql
        └── services/          cloudinaryStorage, emailService, powerAutomate
```

---

## Features

### Candidate Portal

| Feature | Description |
|---------|-------------|
| Job Board | Browse jobs with search, filter by type, bookmark/save jobs |
| Job Detail | Full job description, requirements, apply with PDF resume upload |
| Apply | Upload CV, auto-extract text, AI cover letter generation, submit |
| My Applications | Track all applications with status, AI score, board/list view |
| AI Chat (CareerBot) | GPT-4o-mini chat with web search, course finder, voice I/O |
| ATS Analyzer | Upload resume, score against job description (0-100), skills gap |
| Mock Interview | 10-question AI interview, per-answer feedback, CV enhancement tips |
| Skill Assessment | 10-question hard quiz per skill, verified badge on profile |
| Find Courses | Udemy + Coursera search via Tavily |
| Web Search | Real-time web search via Tavily |
| Profile | Edit name, phone, headline, skill tag chips, interview history |
| Notifications | Real-time bell with application status updates |

### Admin Portal

| Feature | Description |
|---------|-------------|
| Dashboard | Stats (total, pending, reviewing, accepted, rejected), recent apps, top candidates by AI score |
| All Applications | Paginated table, search, filter by status, bulk status update, checkbox select |
| Application Detail | Full candidate info, resume download, AI analysis (Analyze Now button), workflow logs |
| Manage Jobs | Create, edit, toggle active/inactive jobs |
| All Users | View all registered users |
| AI Chat | Same CareerBot available to admins |
| ATS Analyzer | Resume analysis tool for admins |
| Skill Assessment | Quiz tool for admins |
| Settings | n8n webhook URL, notification email, system status, deployment info |

---

## Backend API Routes

### Applications — `/api/applications`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List applications (filter: status, search, email, pagination) |
| GET | `/stats` | Dashboard statistics |
| GET | `/:id` | Single application with workflow logs |
| POST | `/` | Create application (multipart, triggers background AI analysis + Cloudinary upload) |
| POST | `/:id/analyze` | On-demand AI analysis for admin |
| PATCH | `/:id/status` | Update status (triggers in-app notification) |
| DELETE | `/:id` | Delete application |

### Jobs — `/api/jobs`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Active jobs (filter: type, department, search) |
| GET | `/all` | All jobs including inactive (admin) |
| GET | `/:id` | Single job |
| GET | `/:id/applications` | Applicants for a job |
| POST | `/` | Create job |
| PATCH | `/:id` | Update job |
| DELETE | `/:id` | Delete job |

### Users — `/api/users`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/sync` | Upsert user after Firebase login |
| GET | `/me` | Get current user profile |
| PATCH | `/me` | Update profile (name, phone, headline, skills) |
| GET | `/` | All users (admin) |

### Resumes — `/api/resumes`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload/:applicationId` | Upload resume to Cloudinary |
| GET | `/:applicationId/download` | Download resume (Cloudinary redirect or local fallback) |

### CareerBot — `/api/careerbot`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/chat` | AI chat with tool use (web search, courses, profiles) |
| POST | `/analyze-ats` | ATS resume analysis |
| POST | `/courses` | Find Udemy/Coursera courses |
| POST | `/search` | Web search via Tavily |
| POST | `/profiles` | LinkedIn profile search |
| POST | `/simple-chat` | Simple LLM chat (no tools) |
| GET | `/sessions` | Load chat sessions for user |
| POST | `/sessions` | Save/upsert chat session |
| DELETE | `/sessions/:id` | Delete chat session |

### AI Features — `/api/ai`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/interview/start` | Start mock interview (returns first question as JSON) |
| POST | `/interview/answer` | Submit answer, get feedback + next question |
| GET | `/interview/history/:candidateId` | Interview session history |
| POST | `/cover-letter` | Generate AI cover letter (streaming) |
| POST | `/skill-quiz/generate` | Generate 10-question skill quiz |
| POST | `/skill-quiz/submit` | Submit answers, get score + correct answers |
| POST | `/linkedin-optimizer` | LinkedIn profile optimization |

### Admin — `/api/admin`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/applications/kanban` | Kanban grouped data |
| GET | `/notifications` | User notifications |
| PATCH | `/notifications/read` | Mark all notifications read |
| GET | `/top-candidates` | Top 5 candidates by AI score |

### Settings — `/api/settings`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | All settings as key-value map |
| PUT | `/` | Update settings |

### Webhooks — `/api/webhooks`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/resume-analyzed` | Callback from n8n after resume analysis |
| POST | `/status-update` | Status update webhook |
| GET | `/pending-followups` | Pending follow-up applications |
| GET | `/workflow-logs` | Workflow execution logs |

---

## Database Schema (PostgreSQL)

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID |
| firebase_uid | TEXT UNIQUE | Firebase user ID |
| email | TEXT | |
| name | TEXT | |
| photo_url | TEXT | |
| role | TEXT | `admin` or `candidate` |
| phone | TEXT | |
| skills | TEXT | Comma-separated |
| headline | TEXT | |
| verified_skills | JSONB | Array of verified skill names |

### `applications`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID |
| job_id | TEXT | FK to jobs |
| user_id | TEXT | Firebase UID |
| full_name, email, phone | TEXT | |
| position | TEXT | |
| experience_years | INTEGER | |
| cover_letter | TEXT | |
| resume_filename | TEXT | Original filename |
| resume_path | TEXT | Cloudinary URL or local path |
| ai_score | REAL | 0-100 match score |
| ai_skills | TEXT | JSON array |
| ai_missing_skills | TEXT | JSON array |
| ai_analysis | TEXT | 2-sentence summary |
| status | TEXT | pending/reviewing/shortlisted/interviewed/accepted/rejected |
| workflow_status | TEXT | none/triggered/completed/failed |
| notes | TEXT | Admin notes |

### `jobs`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| title, company, location | TEXT | |
| type | TEXT | Full-Time/Part-Time/Remote/Internship/Contract |
| description, requirements | TEXT | Requirements stored as JSON array |
| salary_range, department | TEXT | |
| is_active | BOOLEAN | |

### `chat_sessions`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| user_id | TEXT | Firebase UID (no FK constraint) |
| bot_type | TEXT | `careerbot` or `helpbot` |
| title | TEXT | |
| messages | TEXT | JSON array |

### `interview_sessions`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID |
| candidate_id | TEXT | FK to users.id |
| job_id | TEXT | FK to jobs.id |
| conversation | JSONB | Message history |
| score | INTEGER | 0-100 |
| feedback, strengths, improvements | TEXT/TEXT[] | |

### `pending_quizzes`
| Column | Type | Notes |
|--------|------|-------|
| token | TEXT PK | UUID |
| skill | TEXT | |
| questions | JSONB | Array with correctIndex |
| expires_at | TIMESTAMPTZ | 30 min TTL |
| used | BOOLEAN | |

### `notifications`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | gen_random_uuid() |
| user_id | TEXT | Firebase UID |
| title, message | TEXT | |
| type | TEXT | info/success/error |
| is_read | BOOLEAN | |

### `settings`
| Column | Type | Notes |
|--------|------|-------|
| key | TEXT PK | |
| value | TEXT | |

---

## Third-Party Services & Libraries

### APIs
| Service | Purpose | Key Location |
|---------|---------|-------------|
| OpenRouter | LLM (GPT-4o-mini) for all AI features | `backend/.env` → `OPENROUTER_API_KEY` |
| Tavily | Web search, course finder, profile search | `backend/.env` → `TAVILY_API_KEY` |
| Firebase | Authentication (Google + email) | `frontend/.env` → `VITE_FIREBASE_*` |
| Cloudinary | Resume PDF storage | `backend/.env` → `CLOUDINARY_URL` |
| n8n | Email automation webhook | `settings` table → `pa_new_application_url` |

### Frontend Libraries
| Library | Version | Purpose |
|---------|---------|---------|
| react | 19 | UI framework |
| react-router-dom | 7 | Client-side routing |
| framer-motion | 12 | Animations on landing page |
| lucide-react | latest | Icons |
| pdfjs-dist | 5 | Client-side PDF text extraction |
| firebase | 12 | Auth SDK |
| @hello-pangea/dnd | 18 | Drag and drop (previously used for kanban) |

### Backend Libraries
| Library | Version | Purpose |
|---------|---------|---------|
| express | 4 | HTTP server |
| pg | 8 | PostgreSQL client |
| multer | 1 | File upload handling |
| cloudinary | latest | Resume cloud storage |
| uuid | 11 | UUID generation |
| express-validator | 7 | Request validation |
| dotenv | 16 | Environment variables |
| cors | 2 | Cross-origin requests |
| tsx | 4 | TypeScript execution in dev |

---

## Authentication Flow

1. User clicks "Login with Google" or enters email/password
2. Firebase SDK handles auth, returns `firebaseUser` with `uid`
3. Frontend calls `POST /api/users/sync` with `firebase_uid`, `email`, `name`, `photo_url`
4. Backend upserts user in PostgreSQL, assigns role (`admin` if email matches `mayankgupta23081@gmail.com`, else `candidate`)
5. `AuthContext` stores `AppUser` with role, id, profile data
6. `ProtectedRoute` checks role before rendering admin/candidate pages

---

## AI Analysis Flow (on application submit)

1. Candidate uploads PDF resume on job detail page
2. Frontend extracts text using `pdfjs-dist`
3. `POST /api/applications` receives `resume_text` + `job_description`
4. Application inserted into DB immediately → response sent to user
5. Background async task calls OpenRouter with resume + JD
6. AI returns JSON: `{ overall_score, top_skills, missing_keywords, summary }`
7. DB updated with AI fields ~15-30 seconds after submission
8. Admin can also click "Analyze Now" on any application to trigger on-demand

---

## Environment Variables

### Backend (`backend/.env`)
```
PORT=3001
DATABASE_URL=postgresql://...
DATABASE_SSL=true
OPENROUTER_API_KEY=sk-or-v1-...
TAVILY_API_KEY=tvly-...
OPENROUTER_MODEL=openai/gpt-4o-mini
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
FRONTEND_URL=https://ai-job-application-eight.vercel.app
```

### Frontend (`frontend/.env`)
```
VITE_API_BASE_URL=https://ai-job-application-1.onrender.com/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## Deployment

### Vercel (Frontend)
- Root directory: `frontend`
- Build command: `npm run build`
- Output: `dist`
- Set `VITE_API_BASE_URL` in Vercel environment variables

### Render (Backend)
- Root directory: `backend`
- Build: `npm ci && npm run build`
- Start: `npm start`
- Node: `20.x`
- Set all backend env vars in Render dashboard

---

## Local Development

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev   # runs on http://localhost:3001

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev   # runs on http://localhost:5173
```
