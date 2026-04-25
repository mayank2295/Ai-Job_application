# Bugfix Requirements Document

## Introduction

This project is a full-stack AI job application platform (JobFlow AI) built incrementally using multiple AI coding tools (VS Code Copilot, Antigravity, and Cursor). The combination of tools has introduced a set of overlapping, conflicting, and broken code patterns across the frontend (React/TypeScript/Vite on Vercel) and backend (Node.js/TypeScript/Express on Render with PostgreSQL). The bugs span broken navigation links, a UUID artifact corrupting rendered markdown, a duplicate Express route handler, a missing `VITE_API_BASE_URL` env variable, a `shortlisted` status mismatch between the database schema and the frontend type definitions, exposed API keys in the frontend `.env`, a broken SQL search query in the jobs route, and CSS/layout conflicts between the landing page's isolated design system and the app's global design system. Each issue is documented below with its current defective behavior, the expected correct behavior, and the existing behavior that must be preserved.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a logged-in user clicks the "Open Dashboard" or profile link on the landing page (`LandingPage.tsx`) THEN the system navigates to `/dashboard` which immediately redirects to `/admin/dashboard` for admins or `/jobs` for candidates via a legacy redirect, causing an unnecessary double-navigation and a flash of the wrong route.

1.2 WHEN the `renderMarkdown` function in `frontend/src/lib/careerbot-api.js` processes a message containing bullet-point list items THEN the system renders a raw UUID string (`6fe878ce-9762-47c2-8574-2780712da9ef`) inside the `<ul>` tag instead of the actual list item content, producing broken HTML in every chat message that contains a list.

1.3 WHEN the backend receives a `POST /api/careerbot/sessions` request THEN the system matches the first of two duplicate route handlers registered for the same path; the second handler (lines 274–302 of `careerbot.ts`) is dead code that is never reached, creating ambiguity and a maintenance hazard introduced by two different AI tools writing the same endpoint.

1.4 WHEN the frontend is deployed to Vercel without a `VITE_API_BASE_URL` environment variable set in the Vercel dashboard THEN the system falls back to the hardcoded production URL `https://ai-job-application-1.onrender.com/api`, which works but means the env-variable override mechanism is silently bypassed and any future environment change requires a code change rather than a config change.

1.5 WHEN the frontend `types/index.ts` defines the `Application.status` union type THEN the system omits the `'shortlisted'` value, even though the database schema (`schema.sql`) and the `applications` route status-update validator both include `'shortlisted'` as a valid status; this causes TypeScript type errors and runtime display gaps in `MyApplicationsPage.tsx` when an application has `status = 'shortlisted'`.

1.6 WHEN the backend `GET /api/jobs` route builds a search query with multiple `ILIKE` conditions THEN the system reuses the same `$${params.length}` placeholder index for all three columns (`title`, `description`, `department`) in a single `AND` clause, meaning only one parameter is pushed but three placeholders reference it — this is valid for PostgreSQL (same index reuse) but the intent is ambiguous and the `search` parameter is pushed only once while three `$N` references point to the same index, which works accidentally but is fragile and misleading.

1.7 WHEN the `LandingPage.css` file defines its own complete design system (custom CSS variables `--lp-*`, fonts, layout, animations) scoped under `.lp-page` THEN the system loads two separate font families (`Sora` from `LandingPage.css` and `Inter` from `index.css`) and two separate sets of CSS custom properties, causing visual inconsistency between the landing page and the authenticated app shell, and the `ThemeToggle` component renders with `index.css` variables while the landing page uses `--lp-*` variables, producing a mismatched toggle appearance on the landing page.

1.8 WHEN the frontend `.env` file is committed to the repository THEN the system exposes live API keys (`VITE_OPENROUTER_API_KEY`, `VITE_TAVILY_API_KEY`, Firebase config keys) in version control; additionally, `VITE_OPENROUTER_API_KEY` and `VITE_TAVILY_API_KEY` are present in the frontend bundle even though these keys are only needed server-side (the backend already reads them from its own `.env`), meaning they are unnecessarily exposed to the browser.

1.9 WHEN the `WebSearchPage.tsx` passes `initialTab="search"` to the `CareerBot` component THEN the system renders the default `"chat"` tab because the `CareerBot` component only handles `"chat"`, `"resume"`, and `"courses"` as valid tab values; `"search"` is not a recognised tab, so the web search tab never renders.

1.10 WHEN the `CareerBotPage.tsx` and `AtsResumePage.tsx` pages import `CareerBot` from `'../components/CareerBot'` THEN the system suppresses TypeScript checking with `// @ts-ignore`, masking any type errors in the JSX component interface; similarly `MyApplicationsPage` and `ProfilePage` are imported with `// @ts-ignore` in `App.tsx` despite being valid TypeScript files.

---

### Expected Behavior (Correct)

2.1 WHEN a logged-in user clicks the "Open Dashboard" or profile link on the landing page THEN the system SHALL navigate directly to `/admin/dashboard` for admin users and `/jobs` for candidate users, without an intermediate redirect through `/dashboard`.

2.2 WHEN the `renderMarkdown` function processes a message containing bullet-point list items THEN the system SHALL render a proper `<ul>` element wrapping the `<li>` items with no UUID or placeholder text visible in the output.

2.3 WHEN the backend registers routes for `POST /api/careerbot/sessions` THEN the system SHALL have exactly one handler for that path; the duplicate dead-code handler SHALL be removed so the route table is unambiguous.

2.4 WHEN the frontend is deployed to Vercel THEN the system SHALL read the API base URL from the `VITE_API_BASE_URL` environment variable set in the Vercel project settings, and the `.env.example` file SHALL document this variable so future deployments are correctly configured.

2.5 WHEN the `Application` type in `frontend/src/types/index.ts` defines the `status` field THEN the system SHALL include `'shortlisted'` in the union type so it matches the database schema and the backend validator, eliminating the TypeScript error and ensuring `MyApplicationsPage.tsx` displays the correct label for shortlisted applications.

2.6 WHEN the backend `GET /api/jobs` route builds a search query THEN the system SHALL push the search term once and reference it with a single `$N` placeholder, or push it three times and use three distinct `$N` placeholders, making the intent explicit and the query unambiguous.

2.7 WHEN the `ThemeToggle` component renders on the landing page THEN the system SHALL display consistently with the landing page's visual style; the landing page CSS SHALL NOT conflict with `index.css` global variables for shared components, and both pages SHALL use the same `Inter` font family.

2.8 WHEN the frontend `.env` file is managed THEN the system SHALL ensure that `VITE_OPENROUTER_API_KEY` and `VITE_TAVILY_API_KEY` are removed from the frontend environment (they are only needed in the backend), and the `.env` file SHALL be listed in `.gitignore` so live keys are never committed to version control.

2.9 WHEN `WebSearchPage.tsx` renders the `CareerBot` component THEN the system SHALL pass a valid `initialTab` value that the component recognises, so the correct tab is displayed on load.

2.10 WHEN `CareerBotPage.tsx`, `AtsResumePage.tsx`, `MyApplicationsPage.tsx`, and `ProfilePage.tsx` are imported THEN the system SHALL NOT require `// @ts-ignore` suppressions; the `CareerBot` component SHALL have a proper TypeScript interface or the import SHALL be typed correctly.

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN an unauthenticated user visits the landing page THEN the system SHALL CONTINUE TO display the landing page correctly with the login button and all sections visible.

3.2 WHEN a user signs in with Google or email/password THEN the system SHALL CONTINUE TO authenticate via Firebase and sync the user record to the PostgreSQL backend.

3.3 WHEN an admin user is authenticated THEN the system SHALL CONTINUE TO be redirected to `/admin/dashboard` and have access to all admin routes.

3.4 WHEN a candidate user is authenticated THEN the system SHALL CONTINUE TO be redirected to `/jobs` and have access to all candidate routes.

3.5 WHEN the `CareerBot` component is used with `initialTab="chat"` or `initialTab="resume"` or `initialTab="courses"` THEN the system SHALL CONTINUE TO render the correct tab on load.

3.6 WHEN the backend receives a valid `POST /api/careerbot/sessions` request THEN the system SHALL CONTINUE TO upsert the chat session and return the saved session object.

3.7 WHEN the `renderMarkdown` function processes text without bullet lists THEN the system SHALL CONTINUE TO render bold, italic, code, links, and headings correctly.

3.8 WHEN the backend `GET /api/jobs` route is called without search/filter parameters THEN the system SHALL CONTINUE TO return all active jobs ordered by `created_at DESC`.

3.9 WHEN the `Application` type is used across admin pages (`ApplicationsPage`, `ApplicationDetailPage`, `AdminKanbanPage`) THEN the system SHALL CONTINUE TO compile and render correctly after the type fix.

3.10 WHEN the backend `.env` is read at startup THEN the system SHALL CONTINUE TO load `OPENROUTER_API_KEY` and `TAVILY_API_KEY` from the backend environment for all AI features.

3.11 WHEN the `ThemeToggle` is used inside the authenticated app shell THEN the system SHALL CONTINUE TO switch between dark and light themes using the `index.css` CSS variable system.

3.12 WHEN the `MyApplicationsPage` displays applications with statuses `pending`, `reviewing`, `interviewed`, `accepted`, or `rejected` THEN the system SHALL CONTINUE TO render the correct label and color for each status.

---

## Bug Condition Derivation

### Bug Condition Functions

```pascal
FUNCTION isBugCondition_LandingPageLink(X)
  INPUT: X of type NavigationEvent
  OUTPUT: boolean
  RETURN X.page = 'LandingPage' AND X.userLoggedIn = TRUE AND X.linkTarget = '/dashboard'
END FUNCTION

FUNCTION isBugCondition_MarkdownUUID(X)
  INPUT: X of type MarkdownInput
  OUTPUT: boolean
  RETURN X.text CONTAINS bullet list items (lines starting with '-' or '•')
END FUNCTION

FUNCTION isBugCondition_DuplicateRoute(X)
  INPUT: X of type ExpressRouteTable
  OUTPUT: boolean
  RETURN COUNT(routes WHERE method='POST' AND path='/api/careerbot/sessions') > 1
END FUNCTION

FUNCTION isBugCondition_MissingEnvVar(X)
  INPUT: X of type DeploymentConfig
  OUTPUT: boolean
  RETURN X.platform = 'Vercel' AND X.env['VITE_API_BASE_URL'] IS NOT SET
END FUNCTION

FUNCTION isBugCondition_StatusTypeMismatch(X)
  INPUT: X of type ApplicationStatus
  OUTPUT: boolean
  RETURN X.status = 'shortlisted' AND TypeDefinition.status DOES NOT INCLUDE 'shortlisted'
END FUNCTION

FUNCTION isBugCondition_ExposedFrontendKeys(X)
  INPUT: X of type FrontendEnvFile
  OUTPUT: boolean
  RETURN X.contains('VITE_OPENROUTER_API_KEY') OR X.contains('VITE_TAVILY_API_KEY')
END FUNCTION

FUNCTION isBugCondition_InvalidWebSearchTab(X)
  INPUT: X of type CareerBotProps
  OUTPUT: boolean
  RETURN X.initialTab = 'search'
END FUNCTION
```

### Fix Checking Properties

```pascal
// Property: Fix Checking — Landing Page Navigation
FOR ALL X WHERE isBugCondition_LandingPageLink(X) DO
  result ← navigate'(X)
  ASSERT result.path = (X.userRole = 'admin' ? '/admin/dashboard' : '/jobs')
  ASSERT result.redirectCount = 0
END FOR

// Property: Fix Checking — Markdown UUID Artifact
FOR ALL X WHERE isBugCondition_MarkdownUUID(X) DO
  result ← renderMarkdown'(X.text)
  ASSERT result DOES NOT CONTAIN any UUID pattern
  ASSERT result CONTAINS '<ul>' AND '<li>'
END FOR

// Property: Fix Checking — Duplicate Route
FOR ALL X WHERE isBugCondition_DuplicateRoute(X) DO
  result ← routeTable'
  ASSERT COUNT(routes WHERE method='POST' AND path='/api/careerbot/sessions') = 1
END FOR

// Property: Fix Checking — Status Type Mismatch
FOR ALL X WHERE isBugCondition_StatusTypeMismatch(X) DO
  result ← TypeDefinition'.status
  ASSERT 'shortlisted' IN result.union
END FOR
```

### Preservation Properties

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition_LandingPageLink(X) DO
  ASSERT F(X) = F'(X)  // unauthenticated landing page renders identically
END FOR

FOR ALL X WHERE NOT isBugCondition_MarkdownUUID(X) DO
  ASSERT renderMarkdown(X.text) = renderMarkdown'(X.text)  // non-list markdown unchanged
END FOR

FOR ALL X WHERE NOT isBugCondition_DuplicateRoute(X) DO
  ASSERT F(X) = F'(X)  // all other routes unaffected
END FOR
```
