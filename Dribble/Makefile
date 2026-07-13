# Variables
VENV ?= .venv
ifeq ($(OS),Windows_NT)
    BIN = $(VENV)/Scripts
    PYTHON = $(BIN)/python.exe
    PIP = $(BIN)/pip.exe
else
    BIN = $(VENV)/bin
    PYTHON = $(BIN)/python
    PIP = $(BIN)/pip
endif

# Commands
DOCKER_COMPOSE = docker compose
MANAGE = $(PYTHON) manage.py

.DEFAULT_GOAL := help

.PHONY: help
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

.PHONY: venv
venv: ## Create virtual environment
	python3 -m venv $(VENV)
	@echo "Virtual environment created at $(VENV)."

.PHONY: install
install: ## Install dependencies
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt

.PHONY: setup
setup: venv install ## Setup project from scratch (venv, install dependencies)
	@echo "Project setup complete. Run 'make docker-up' to start the database."

.PHONY: docker-build
docker-build: ## Build docker-compose images
	$(DOCKER_COMPOSE) build

.PHONY: docker-up
docker-up: ## Start docker-compose services (including web) in detached mode
	$(DOCKER_COMPOSE) up -d

.PHONY: docker-down
docker-down: ## Stop and remove docker-compose containers, networks, and volumes
	$(DOCKER_COMPOSE) down

.PHONY: docker-logs
docker-logs: ## View docker-compose logs
	$(DOCKER_COMPOSE) logs -f

.PHONY: docker-migrate
docker-migrate: ## Apply database migrations inside docker web container
	$(DOCKER_COMPOSE) exec web python manage.py migrate

.PHONY: docker-migrations
docker-migrations: ## Create database migrations inside docker web container
	$(DOCKER_COMPOSE) exec web python manage.py makemigrations

.PHONY: docker-superuser
docker-superuser: ## Create django superuser inside docker web container
	$(DOCKER_COMPOSE) exec web python manage.py createsuperuser

.PHONY: docker-test
docker-test: ## Run unit tests inside docker web container
	$(DOCKER_COMPOSE) exec web pytest

.PHONY: migrate
migrate: ## Apply database migrations
	$(MANAGE) migrate

.PHONY: migrations
migrations: ## Create new database migrations
	$(MANAGE) makemigrations

.PHONY: run
run: ## Run local development server
	$(MANAGE) runserver

.PHONY: superuser
superuser: ## Create a Django superuser
	$(MANAGE) createsuperuser

.PHONY: shell
shell: ## Start Django python shell
	$(MANAGE) shell

.PHONY: test
test: ## Run unit tests with pytest
	$(PYTHON) -m pytest

.PHONY: test-cov
test-cov: ## Run unit tests with coverage report
	$(PYTHON) -m pytest --cov=apps --cov-report=term-missing

.PHONY: clean
clean: ## Clean cache files, pyc files, and virtualenv
	find . -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -r {} + 2>/dev/null || true
	find . -type d -name ".coverage" -delete 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
