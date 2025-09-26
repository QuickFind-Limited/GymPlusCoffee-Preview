# Developer shortcuts for the Claude SDK backend service

DOCKER_COMPOSE ?= docker compose
PORT ?= 8000
UV ?= uv

.PHONY: all help up down restart logs logs-pretty clean test

all: help

help:
	@printf "%s\n" \
		"Backend service commands" \
		"" \
		"make up/down         Build or stop the Docker stack" \
		"make logs/logs-pretty Tail container logs" \
		"make restart/clean    Restart or reset containers" \
		"make test             Run the pytest suite"


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


test:
	@$(UV) run pytest -q


