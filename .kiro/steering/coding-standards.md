# JobFlow AI — Coding Standards

## SQL
- Always use `$N` placeholders: `WHERE id = $1`, never `WHERE id = ${params.length}` without the `$`
- Build dynamic queries by pushing to a `params` array and using `params.length` for the index
- For repeated placeholders (e.g. ILIKE on 3 columns), capture `const idx = params.length` before pushing

## TypeScript
- No `@ts-ignore` — use `.d.ts` declaration files for untyped JS modules
- CareerBot.jsx has `frontend/src/components/CareerBot.d.ts` for its types
- careerbot-api.js has `frontend/src/lib/careerbot-api.d.ts` for its types
- Unused imports/variables cause build failures on Vercel — always clean them up

## Security
- OpenRouter and Tavily API keys are BACKEND ONLY — never add VITE_ prefixed versions
- Firebase config keys (VITE_FIREBASE_*) are safe to expose — they're public by design
- Never commit .env files — they are gitignored

## API patterns
- All backend responses use `res.json()` — no streaming except cover letter generation
- AI analysis always runs in background after `res.json()` is called (non-blocking)
- File uploads: save locally first for instant response, then upload to Cloudinary async
- Status updates trigger in-app notifications via `notifications` table

## Frontend patterns
- API base URL: always use the `API_BASE` constant, never hardcode URLs
- All pages use `className="page-container"` as the root wrapper
- Cards use `className="card"` — consistent 24px padding, 12px border-radius
- Buttons: `btn btn-primary` (purple), `btn btn-secondary` (outlined), `btn btn-ghost`, `btn btn-danger`
- Status badges: `className={\`badge badge-${status}\`}` — matches CSS classes

## File conventions
- Pages: `frontend/src/pages/PageName.tsx`
- Components: `frontend/src/components/ComponentName.tsx`
- Backend routes: `backend/src/routes/routename.ts`, exported as `export default router`
- New routes must be registered in `backend/src/server.ts`

## Em dashes and special characters
- Do NOT use `—` (em dash) or `…` (ellipsis) in JSX/JS string literals — Oxc parser rejects them
- Use `-` and `...` instead
