# 🎯 MIGHTY VERSE - DEVELOPMENT COMMANDS

.PHONY: help status setup test build deploy clean

# Default target
help:
	@echo "🎯 MIGHTY VERSE DEVELOPMENT COMMANDS"
	@echo "===================================="
	@echo ""
	@echo "📊 Monitoring:"
	@echo "  status     - Check overall project status"
	@echo "  missions   - Show mission progress"
	@echo ""
	@echo "🔧 Development:"
	@echo "  setup      - Initial project setup"
	@echo "  dev        - Start development servers"
	@echo "  test       - Run all tests"
	@echo "  build      - Build all components"
	@echo ""
	@echo "🚀 Deployment:"
	@echo "  deploy     - Deploy to staging"
	@echo "  clean      - Clean build artifacts"
	@echo ""

# Status checking
status:
	@./scripts/progress-check.sh

missions:
	@echo "📋 Mission Status Summary:"
	@echo "========================="
	@if [ -f docs/MISSION_STATUS.md ]; then \
		grep "^- \[" docs/MISSION_STATUS.md | head -10; \
	else \
		echo "Mission status file not found"; \
	fi

# Development setup
setup:
	@echo "🔧 Setting up development environment..."
	@if [ -d agents-stubs ]; then \
		cd agents-stubs && pip install -r requirements.txt; \
	fi
	@if [ -f web/package.json ]; then \
		cd web && npm install; \
	fi
	@echo "✅ Setup complete"

# Development servers
dev:
	@echo "🚀 Starting development servers..."
	@echo "FastAPI: http://localhost:8000"
	@echo "Next.js: http://localhost:3000"
	@echo ""
	@echo "Starting FastAPI service..."
	@cd agents-stubs && uvicorn service.app:app --reload --port 8000 &
	@echo "Starting Next.js frontend..."
	@cd web && npm run dev &
	@echo "✅ Services started"

# Testing
test:
	@echo "🧪 Running test suite..."
	@if [ -d agents-stubs/tests ]; then \
		cd agents-stubs && python -m pytest tests/ -v; \
	fi
	@if [ -f web/package.json ]; then \
		cd web && npm test; \
	fi

# Building
build:
	@echo "🔨 Building project..."
	@if [ -f web/package.json ]; then \
		cd web && npm run build; \
	fi
	@echo "✅ Build complete"

# Deployment
deploy:
	@echo "🚀 Deploying to staging..."
	@make build
	@echo "✅ Deployment complete"

# Cleanup
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf web/.next
	@rm -rf web/out
	@rm -rf agents-stubs/__pycache__
	@rm -rf agents-stubs/**/__pycache__
	@echo "✅ Cleanup complete"

# Quick development workflow
quick-start: setup dev

# Full CI workflow
ci: test build

# Mission management
mission-status:
	@echo "📊 Detailed Mission Status:"
	@echo "=========================="
	@cat docs/MISSION_STATUS.md | grep -A 5 -B 1 "^##"