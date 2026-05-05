.PHONY: dev build test lint format typecheck coverage help

help:
	@echo "Available commands:"
	@echo "  make dev       - Start development server"
	@echo "  make build     - Build for production"
	@echo "  make test      - Run tests"
	@echo "  make lint      - Run linter"
	@echo "  make format    - Format code"
	@echo "  make typecheck - Run type checker"
	@echo "  make coverage  - Run tests with coverage"

dev:
	npm run dev

build:
	npm run build

test:
	npm run test

lint:
	npm run lint

format:
	npm run format

typecheck:
	npm run typecheck

coverage:
	npm run test:coverage
