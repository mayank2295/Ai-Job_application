# JobFlow AI — Project Context

## What this project is
A full-stack AI-powered hiring platform with two portals:
- **Admin Portal** — recruiters manage jobs, applications, candidates, AI analysis
- **Candidate Portal** — job seekers browse jobs, apply, use AI career tools

## Live URLs
- Frontend: https://ai-job-application-eight.vercel.app
- Backend API: https://ai-job-application-1.onrender.com/api
- Health: https://ai-job-application-1.onrender.com/api/health

## Tech Stack
- Frontend: React 19 + TypeScript + Vite, deployed on Vercel
- Backend: Node.js + Express + TypeScript, deployed on Render
- Database: PostgreSQL (Render external DB)
- Auth: Firebase (Google + email/password)
- AI/LLM: OpenRouter API (GPT-4o-mini) — backend only
- Web Search: Tavily Search API — backend only
- File Storage: Cloudinary (resume PDFs)
- PDF Parsing: pdfjs-dist (client-side)
- Automation: n8n webhook for email notifications
- Icons: lucide-react
- Animations: framer-motion (landing page only)

## Admin credentials
- Admin email: mayankgupta23081@gmail.com (hardcoded in users.ts and AuthContext.tsx)

## Key architectural decisions
- Firebase UID is used as user_id in chat_sessions (NOT the PostgreSQL users.id UUID)
- AI analysis on application submit runs in background AFTER response is sent (non-blocking)
- Resume files: saved locally first, then uploaded to Cloudinary in background
- SQL placeholders MUST use $N format (e.g. $1, $2) — never bare numbers
- No @ts-ignore suppressions — use proper type declarations instead
- API keys (OpenRouter, Tavily) are backend-only — never in frontend bundle
- .env files are gitignored — keys set in Render/Vercel dashboards

## Folder structure
- frontend/src/pages/ — all route pages
- frontend/src/components/ — reusable components
- frontend/src/api/client.ts — all API calls
- frontend/src/lib/careerbot-api.js — CareerBot API helpers
- backend/src/routes/ — all Express route handlers
- backend/src/services/ — cloudinaryStorage, emailService, powerAutomate
- backend/src/database/db.ts — PostgreSQL pool + helpers
