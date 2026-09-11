# Thin wrappers over docker compose. Nothing here is load-bearing — every
# target is one command you could type yourself.

COMPOSE ?= docker compose

.DEFAULT_GOAL := help
.PHONY: help up down restart build logs ps sh psql redis smoke landing clean nuke

help: ## Show this help
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

up: ## Start the whole stack
	$(COMPOSE) up -d
	@echo
	@echo "  landing   http://localhost:$${LANDING_PORT:-8080}"
	@echo "  app       http://localhost:$${WEB_PORT:-8000}"
	@echo "  og        http://localhost:$${OG_PORT:-3000}/healthz"
	@echo "  mail      http://localhost:$${MAILPIT_UI_PORT:-8025}"

down: ## Stop the stack, keep the database
	$(COMPOSE) down

restart: down up ## Restart everything

build: ## Rebuild the images we own (php, og)
	$(COMPOSE) build --pull php og

logs: ## Tail logs (make logs s=og)
	$(COMPOSE) logs -f $(s)

ps: ## Show container status
	$(COMPOSE) ps

sh: ## Shell into the php container
	$(COMPOSE) exec php bash

psql: ## Open psql on the app database
	$(COMPOSE) exec db psql -U $${POSTGRES_USER:-imvite} -d $${POSTGRES_DB:-imvite}

redis: ## Open redis-cli
	$(COMPOSE) exec redis redis-cli

smoke: ## Check every service answers
	@bin/smoke

landing: ## Serve only the landing page
	$(COMPOSE) up -d landing

clean: ## Stop and remove containers and networks
	$(COMPOSE) down --remove-orphans

nuke: ## Stop everything and DELETE the database volume
	$(COMPOSE) down -v --remove-orphans
