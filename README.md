# Gym+Coffee Platform

Unified workspace for the Gym+Coffee internal tooling stack. The repository hosts:
- **backend/** – FastAPI service that wraps the Claude Code SDK and exposes streaming/query endpoints used by internal workflows.
- **frontend/** – Vite + React dashboard for interacting with Supabase, the Python backend, and related integrations.

## Requirements
- Python 3.13+ and [uv](https://docs.astral.sh/uv/) for backend dependency management.
- Node.js 20+ for the frontend.
- Docker (optional) for containerised backend runs.
- Valid API keys (Anthropic, Atla Insights, Supabase, optional NetSuite) stored in local `.env` files.

## Getting Started
1. **Clone the repo** and create a feature branch (`git checkout -b chore/repo-cleanup` as an example).
2. **Backend setup**
   ```bash
   cd backend
   cp .env.example .env   # fill in required secrets
   uv sync
   uv run --env-file .env uvicorn src.claude_sdk_server.main:app --reload --host 0.0.0.0 --port 8000
   ```
3. **Frontend setup**
   ```bash
   cd frontend
   cp .env.example .env    # add Supabase + backend URLs
   npm install
   npm run dev
   ```
4. Visit the frontend dev server (defaults to `http://localhost:3002`) and ensure the backend responds on `http://localhost:8000`.

## Repository Structure
```
.
├── backend/            # FastAPI + Claude Code SDK service
├── frontend/           # Vite + React client
├── README.md           # This file
└── .gitignore
```
Each application maintains its own README with detailed instructions (`backend/README.md` and `frontend/README.md`).

## Useful Commands
- `make` targets exist in both apps (`make help` inside `backend/` for the latest list).
- Run backend tests: `cd backend && make test`.
- Run frontend tests: `cd frontend && npm run test`.

## Environment Files
- Backend expects `backend/.env` (see `backend/.env.example`).
- Frontend expects `frontend/.env` (see `frontend/.env.example`).
- Environment files are git-ignored; rotate any credentials that were ever committed.

## Conventions
- Prefer `uv`/`npm` scripts over ad-hoc commands to keep tooling consistent.
- Keep documentation and secrets templates up to date whenever APIs or integrations change.
- Follow the existing branch naming convention (`chore/...`, `feat/...`, etc.) and open PRs against `develop`.

Happy building!
