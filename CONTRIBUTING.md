# Contributing to JobFlow AI

First off — thank you for taking the time to contribute! 🎉  
JobFlow AI is an open-source project and we welcome contributions from the community, whether that's a bug fix, a new feature, improved documentation, or even just a typo correction.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Requesting Features](#requesting-features)
  - [Submitting a Pull Request](#submitting-a-pull-request)
- [Code Style & Conventions](#code-style--conventions)
- [Code Review Process](#code-review-process)
- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)

---

## Code of Conduct

By participating in this project you agree to abide by our standard of being respectful, inclusive, and constructive. Please keep discussions professional and welcoming to contributors of all backgrounds and experience levels.

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/JobFlow-AI.git
   cd JobFlow-AI
   ```
3. **Add the upstream remote** so you can pull in the latest changes:
   ```bash
   git remote add upstream https://github.com/mayank2295/JobFlow-AI.git
   ```

---

## Development Setup

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20.x |
| npm | 9+ |
| PostgreSQL | 14+ |

### Backend

```bash
cd backend
cp .env.example .env   # fill in your values
npm install
npm run dev
```

Runs on **http://localhost:3001**.

### Frontend

```bash
cd frontend
cp .env.example .env   # fill in your values
npm install
npm run dev
```

Runs on **http://localhost:5174**.

### Required environment variables

**`backend/.env`**
```
PORT=3001
DATABASE_URL=postgresql://...
DATABASE_SSL=true
OPENROUTER_API_KEY=sk-or-v1-...
TAVILY_API_KEY=tvly-...
OPENROUTER_MODEL=openai/gpt-4o-mini
FRONTEND_URL=http://localhost:5174
```

**`frontend/.env`**
```
VITE_API_BASE_URL=http://localhost:3001/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> ⚠️ **Never commit `.env` files.** They are listed in `.gitignore`.

---

## How to Contribute

### Reporting Bugs

If you find a bug, please [open a bug report](.github/ISSUE_TEMPLATE/bug_report.md) using the issue template. Include:

- A clear, descriptive title.
- Steps to reproduce the issue.
- Expected vs. actual behaviour.
- Screenshots or logs where relevant.
- Your environment (OS, Node version, browser).

### Requesting Features

Have an idea? [Open a feature request](.github/ISSUE_TEMPLATE/feature_request.md) with as much context as possible — the problem you're solving, a description of the solution you'd like, and any alternatives you've considered.

### Submitting a Pull Request

1. **Sync with upstream** before starting work:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch** off `main` (see [Branch Naming](#branch-naming)):
   ```bash
   git checkout -b feat/your-feature-name
   ```

3. **Make your changes.** Keep commits small and focused (see [Commit Messages](#commit-messages)).

4. **Run the project locally** and verify that nothing is broken.

5. **Push your branch** to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```

6. **Open a Pull Request** against `mayank2295/JobFlow-AI:main`.  
   - Fill in the [PR template](.github/PULL_REQUEST_TEMPLATE.md) completely.  
   - Link any related issues using `Closes #<issue-number>`.  
   - Add screenshots for any UI changes.

7. **Respond to review feedback** promptly. Update your branch and push — the PR will refresh automatically.

---

## Code Style & Conventions

- **TypeScript** is required for all new backend and frontend files — no `@ts-ignore` suppressions.
- **SQL placeholders** must use the `$N` format (e.g. `$1`, `$2`) — never bare numbers.
- **API keys** (OpenRouter, Tavily, Firebase, etc.) are **backend-only** — never include them in the frontend bundle.
- Follow existing naming conventions in the file you are editing.
- Keep components small and single-purpose.
- Prefer `lucide-react` for icons.

---

## Code Review Process

All pull requests go through the following steps before being merged:

1. **Automated checks** — GitHub Actions will run linting and build checks on every PR. All checks must pass.
2. **AI review** — GitHub Copilot will automatically review the diff and leave inline comments. Address any flagged issues.
3. **Maintainer approval** — The repository owner (@mayank2295) reviews the PR and either requests changes or approves.
4. **Merge** — Once approved and all checks are green, the PR is merged into `main`.

> PRs that do not pass automated checks or have unresolved review comments will not be merged.

---

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| New feature | `feat/<short-description>` | `feat/kanban-filters` |
| Bug fix | `fix/<short-description>` | `fix/resume-upload-error` |
| Documentation | `docs/<short-description>` | `docs/update-readme` |
| Refactor | `refactor/<short-description>` | `refactor/careerbot-api` |
| Chore / tooling | `chore/<short-description>` | `chore/update-deps` |

---

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(optional scope): <short summary>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**
```
feat(careerbot): add streaming response support
fix(resume): handle missing PDF metadata gracefully
docs: update environment variable table in README
```

---

Thank you again for contributing — every improvement, no matter how small, makes JobFlow AI better for everyone! 🚀
