# Cleanup Notes (2025-09-22)

This repository was assembled from the existing `gympluscoffee-frontend` and `lovable/claude_code_api` worktrees.
The following selections and omissions were made intentionally so the new repo only contains actively used code.

## Frontend (`frontend/`)
- **Included**
  - `src/` (minus backup files) and `public/` assets
  - Key config files: `package.json`, `package-lock.json`, `.env.example`, `.gitignore`, `tsconfig*.json`, `vite.config.ts`, `vitest.config.ts`, `postcss.config.js`, `tailwind.config.ts`, `eslint.config.js`, `components.json`, `index.html`
  - Documentation: `README.md`, `CLAUDE.md`, `IMPORTANT_NOTE.md`, `QA_TESTING_PROTOCOL.md`, `ODOO_*` reports, `SUPABASE_MIGRATION_SUMMARY.md`
- **Removed / Not Copied**
  - Build & test artefacts: `dist/`, `coverage/`, `playwright-report/`, `screenshots/`, `memory/`, `e2e/`, `test-results/`
  - Tooling & archived folders: `coordination/`, `odoo_ingestion/`, `odoo_mcp/`, `supabase/`, `tools/`, `data/`, `.roo/`, `.claude/`, `.roomodes`
  - Local secrets: `.env`
  - Node dependencies: `node_modules/`
  - Backup components removed from `src/` (`App.tsx.backup`, `ConversationContext.tsx.backup`)

## Backend (`backend/`)
- **Included**
  - Runtime code under `src/claude_sdk_server/`
  - Config + build files: `Dockerfile`, `docker-compose.yml`, `Makefile`, `pyproject.toml`, `uv.lock`, `.env.example`, `claude-config.json`, `netsuite_helper.py`
  - Unit tests in `tests/`
- **Removed / Not Copied**
  - Legacy UIs: `frontend/`, `chatbot-frontend/`
  - Generated logs / caches: `logs/`, `tmp/`, `.playwright-mcp/`, `.cursor/`, `.claude/`
  - Documentation dumps & examples: `docs/`, `examples/`, assorted markdown notes at repo root
  - Backup router modules dropped from the new copy: `claude_router_backup.py`, `claude_router_sse_fix.py`
  - All `__pycache__/` folders were stripped

If you need anything that was omitted, pull it from the original directories (still at `/home/produser/gympluscoffee-frontend` and `/home/produser/lovable/claude_code_api`).
