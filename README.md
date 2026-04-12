# AI Job Application Automation

Small full-stack project for tracking job applications and handling resume uploads.

## What this app does (today)

- Lets a candidate submit an application
- Lets a candidate upload a resume (PDF/DOC/DOCX)
- Stores application data in SQLite
- Stores resumes in Azure Blob Storage (no resume files are saved on the server disk)
- Provides recruiter-style pages to view applications + activity

## Live

- Frontend (Vercel): https://ai-job-application-eight.vercel.app/
- Backend (Render): https://ai-job-application-f11u.onrender.com
- Backend health: https://ai-job-application-f11u.onrender.com/api/health

Note: the frontend’s production API base URL is currently hardcoded in `frontend/src/api/client.ts`.
If you deploy your own backend, update that URL (or refactor it to use env vars).

## How resume uploads work

1. Frontend sends `multipart/form-data` with a `resume` file
2. Backend validates type and size (10MB max)
3. Backend uploads the bytes to Azure Blob Storage (container defaults to `resumes`)
4. Backend stores the blob URL in `applications.resume_path`
5. Download uses a redirect to a signed blob URL when possible

## Run locally

Open two terminals.

Recommended: use Node `20.x` (matches the Render deploy and avoids native module surprises).

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Local URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

Resume uploads will fail locally unless the Azure env vars are set.

## Backend environment variables

Start from `.env.example`. Don’t commit real secrets.

Required (Azure):

- `AZURE_STORAGE_CONNECTION_STRING`
- `AZURE_STORAGE_CONTAINER_NAME` (default: `resumes`)
- `AZURE_STORAGE_PUBLIC_READ` (optional)
- `AZURE_BLOB_URL_EXPIRY_MINUTES` (used for signed download URLs)

App / integration:

- `PORT`
- `FRONTEND_URL`
- `DB_PATH`
- `WEBHOOK_API_KEY`
- `PA_NEW_APPLICATION_FLOW_URL`
- `PA_RESUME_ANALYSIS_FLOW_URL`

AI assistant (Gemini):

- `GEMINI_API_KEY`
- `GEMINI_MODEL` (default in `.env.example`: `gemini-flash-latest`)

The chat widget lives in `frontend/src/components/AIAssistant.tsx` and calls the backend at `/api/ai/chat`.
Replies are spoken using the browser’s built-in text-to-speech (`speechSynthesis`).

## Deployment notes (what I used)

Backend on Render:

- Root directory: `backend`
- Build: `npm ci && npm rebuild better-sqlite3 --build-from-source && npm run build`
- Start: `npm start`
- Node: `20.x` (native module compatibility)

Frontend on Vercel:

- Root directory: `frontend`
- Build: `npm run build`
- Output: `dist`

## Practical gotchas

- `better-sqlite3` is a native module: if you change Node versions or the deploy platform, force a clean rebuild.
- If you rotate the Azure Storage key, update Render env vars and redeploy.
- SQLite-on-Render is fine for a demo, not for serious scale.

## Next improvements (not done)

- Move DB from SQLite to Postgres
- Add auth/roles for recruiter/admin
- Add malware scanning before storing resumes
