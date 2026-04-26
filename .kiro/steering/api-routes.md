---
inclusion: manual
---

# JobFlow AI — API Routes Reference

Base URL (prod): `https://ai-job-application-1.onrender.com/api`
Base URL (dev): `http://localhost:3001/api`

## Applications — `/api/applications`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List (params: status, search, email, limit, offset) |
| GET | `/stats` | Dashboard stats |
| GET | `/:id` | Single application + workflow logs + candidate |
| POST | `/` | Create (multipart form, triggers background AI + Cloudinary) |
| POST | `/:id/analyze` | On-demand AI analysis |
| PATCH | `/:id/status` | Update status (triggers notification) |
| DELETE | `/:id` | Delete |

## Jobs — `/api/jobs`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Active jobs (params: type, department, search) |
| GET | `/all` | All jobs including inactive |
| GET | `/:id` | Single job |
| GET | `/:id/applications` | Applicants for a job |
| POST | `/` | Create job |
| PATCH | `/:id` | Update job |
| DELETE | `/:id` | Delete job |

## Users — `/api/users`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/sync` | Upsert user after Firebase login |
| GET | `/me` | Get profile (query: firebase_uid) |
| PATCH | `/me` | Update profile |
| GET | `/` | All users (admin) |

## Resumes — `/api/resumes`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload/:applicationId` | Upload to Cloudinary |
| GET | `/:applicationId/download` | Download (redirect to Cloudinary or local) |

## CareerBot — `/api/careerbot`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/chat` | AI chat with tools (web_search, find_courses, scrape_profiles) |
| POST | `/analyze-ats` | ATS resume analysis |
| POST | `/courses` | Find Udemy/Coursera courses |
| POST | `/search` | Web search via Tavily |
| POST | `/profiles` | LinkedIn profile search |
| POST | `/simple-chat` | Simple LLM chat (no tools) |
| GET | `/sessions` | Load sessions (query: user_id, bot_type) |
| POST | `/sessions` | Save/upsert session |
| DELETE | `/sessions/:id` | Delete session |

## AI Features — `/api/ai`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/interview/start` | Start mock interview (body: resumeText, jobId?, candidateId?) |
| POST | `/interview/answer` | Submit answer (body: sessionId, answer, conversationHistory) |
| GET | `/interview/history/:candidateId` | Interview history |
| POST | `/cover-letter` | Generate cover letter (body: jobId, candidateId) |
| POST | `/skill-quiz/generate` | Generate 10-question quiz (body: skill) |
| POST | `/skill-quiz/submit` | Submit answers (body: quizToken, candidateId, answers[]) |
| POST | `/linkedin-optimizer` | LinkedIn optimization (body: resumeText, targetRole) |

## Admin — `/api/admin`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/applications/kanban` | Kanban grouped by status |
| GET | `/notifications` | User notifications (query: user_id) |
| PATCH | `/notifications/read` | Mark all read (body: user_id) |
| GET | `/top-candidates` | Top 5 by AI score |

## Settings — `/api/settings`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | All settings as key-value map |
| PUT | `/` | Update settings |

## Webhooks — `/api/webhooks`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/resume-analyzed` | n8n callback after resume analysis |
| POST | `/status-update` | Status update webhook |
| GET | `/pending-followups` | Pending follow-up applications |
| GET | `/workflow-logs` | Workflow execution logs |

## Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | API health check |
