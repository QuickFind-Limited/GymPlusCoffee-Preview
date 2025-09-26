# Gym+Coffee Backend

FastAPI service that wraps the Claude Code SDK and exposes helper endpoints for Gym+Coffee tooling (clarification datasets, NetSuite lookups, and real-time streaming for the frontend).

## Requirements
- Python 3.13+
- [uv](https://docs.astral.sh/uv/) for dependency management (`pip install uv`)
- Docker (optional, for containerised runs)
- Valid API keys (Anthropic, Atla Insights, optional NetSuite credentials)

## Setup (local Python runtime)
1. Copy the sample environment file and populate secrets:
   ```bash
   cd backend
   cp .env.example .env
   ```
   Required variables:
   - `ANTHROPIC_API_KEY`
   - `ATLA_INSIGHTS_API_KEY`
   - `ATLA_ENVIRONMENT` (for tagging logs/metrics, e.g. `development`)
   - `SUPABASE_URL` / `SUPABASE_ANON_KEY`
   Optional overrides:
   - `LOG_LEVEL`
   - `CLARIFICATION_DATA_DIR`, `CLARIFICATION_CSV_PATH`, `CLARIFICATION_RESULTS_PATH`, `SYSTEM_DEFAULTS_RESULTS_PATH` if you want to point at external datasets.
2. Install dependencies:
   ```bash
   uv sync
   ```
3. Start the API with hot reload:
   ```bash
   uv run --env-file .env uvicorn src.claude_sdk_server.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Docker workflow
```bash
make up      # build and start via docker compose (maps HOST_API_PORT -> 8000)
make logs    # follow container logs
make down    # stop containers
make restart # restart the stack
```

## Makefile shortcuts
See `make help` for the full list. Common targets:
- `make up` – build and start the Docker stack.
- `make down` – stop the containers.
- `make logs` / `make logs-pretty` – follow backend logs.
- `make restart` – cycle the Docker stack.
- `make clean` – remove containers and cached artefacts.
- `make test` – execute the pytest suite.

## API quick reference
- `GET /api/v1/health` – health check.
- `POST /api/v1/query` – primary Claude interaction endpoint (accepts `prompt`, optional `session_id`, `model`, `max_thinking_tokens`, etc.).
- `POST /api/v1/query/stream` – SSE stream of the same operation for real-time updates.
- `GET /api/v1/stream/status` – inspect active streams and backlog metrics.
- `GET /api/v1/stream/clients` – list connected streaming clients.
- Additional routers provide clarification lookups and NetSuite helpers; enable the corresponding credentials to use them.

## Testing
```bash
make test      # runs pytest
make smoke     # basic request against a running instance
```

## Project structure
```
backend/
├── Dockerfile
├── Makefile
├── docker-compose.yml
├── src/
│   └── claude_sdk_server/
│       ├── api/
│       ├── clarifications/
│       ├── services/
│       ├── streaming/
│       └── utils/
└── tests/
```

## Troubleshooting
- **Port in use** – stop existing uvicorn/docker processes (`lsof -i :8000`).
- **Missing datasets** – either place files under `backend/data/` or set `CLARIFICATION_*` env vars to point at your copies. The repository ships read-only snapshots in `src/data/`.
- **Auth errors** – confirm `.env` values and restart the process.

Built with FastAPI, Anthropic Claude, and uv.
