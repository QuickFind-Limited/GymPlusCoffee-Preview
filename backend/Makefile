# Developer shortcuts for the Claude SDK backend service

DOCKER_COMPOSE ?= docker compose
PORT ?= 8000
UV ?= uv
QUERY_BODY ?= {"prompt": "What is 2 + 2?"}

.PHONY: help sync up down restart logs logs-pretty clean run-local test smoke query stream-status stream-clients

help:
	@echo "Backend service commands"
	@echo ""
	@echo "make sync         Install Python dependencies with uv"
	@echo "make run-local    Start the FastAPI app with uvicorn"
	@echo "make up           Build and launch the Docker stack"
	@echo "make down         Stop the Docker stack"
	@echo "make logs         Tail container logs"
	@echo "make logs-pretty  Tail logs with emoji filtering"
	@echo "make restart      Stop then start the Docker stack"
	@echo "make clean        Remove containers and cached build artefacts"
	@echo "make test         Run the pytest suite"
	@echo "make smoke        Hit health and query endpoints (requires running server)"
	@echo "make query        Send a sample JSON payload to /api/v1/query"
	@echo "make stream-status Check streaming status endpoint"
	@echo "make stream-clients List active streaming clients"

sync:
	@$(UV) sync

up:
	@echo "Starting containers with $(DOCKER_COMPOSE) ..."
	@$(DOCKER_COMPOSE) up --build -d
	@echo "API available on http://localhost:$(PORT)"

down:
	@$(DOCKER_COMPOSE) down

restart:
	@$(MAKE) down
	@$(MAKE) up

logs:
	@$(DOCKER_COMPOSE) logs -f

logs-pretty:
	@$(DOCKER_COMPOSE) logs -f | grep -E "🚀|🛠️|🤔|📝|✅|💡|⚡|📊|⏱️" --color=always || true

clean:
	@$(DOCKER_COMPOSE) down -v || true
	@rm -rf __pycache__ .pytest_cache .uv_cache logs

run-local:
	@$(UV) run --env-file .env uvicorn src.claude_sdk_server.main:app --reload --host 0.0.0.0 --port $(PORT)

test:
	@$(UV) run pytest -q

smoke:
	@echo "Checking health endpoint..."
	@curl -fsS http://localhost:$(PORT)/api/v1/health | python3 -m json.tool
	@printf "\nSending sample query...\n"
	@curl -fsS -X POST http://localhost:$(PORT)/api/v1/query \
		-H "Content-Type: application/json" \
		-d '$(QUERY_BODY)' | python3 -m json.tool

query:
	@curl -fsS -X POST http://localhost:$(PORT)/api/v1/query \
		-H "Content-Type: application/json" \
		-d '$(QUERY_BODY)' | python3 -m json.tool

stream-status:
	@curl -fsS http://localhost:$(PORT)/api/v1/stream/status | python3 -m json.tool

stream-clients:
	@curl -fsS http://localhost:$(PORT)/api/v1/stream/clients | python3 -m json.tool
