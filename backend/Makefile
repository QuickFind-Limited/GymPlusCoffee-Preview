# Developer shortcuts for the Claude SDK backend service

DOCKER_COMPOSE ?= docker compose
PORT ?= 8000
UV ?= uv

.PHONY: help up down restart logs logs-pretty clean test

help:
	@echo "Backend service commands"
	@echo ""
	@echo "make up           Build and launch the Docker stack"
	@echo "make down         Stop the Docker stack"
	@echo "make logs         Tail container logs"
	@echo "make logs-pretty  Tail logs with emoji filtering"
	@echo "make restart      Stop then start the Docker stack"
	@echo "make clean        Remove containers and cached build artefacts"
	@echo "make test         Run the pytest suite"


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



