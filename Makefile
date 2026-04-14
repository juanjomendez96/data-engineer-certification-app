NODE_BIN   := /opt/homebrew/bin/node
NPM_BIN    := /opt/homebrew/bin/npm
NEXT       := node node_modules/next/dist/bin/next
TSX        := node node_modules/.bin/tsx
TSC        := node node_modules/typescript/bin/tsc
PORT       := 3000

export PATH := /opt/homebrew/bin:$(PATH)

# ─── Default ──────────────────────────────────────────────────────────────────
.DEFAULT_GOAL := help

.PHONY: help install dev build start stop validate typecheck test clean kill-port

help:
	@echo ""
	@echo "  Databricks Exam Simulator — available targets:"
	@echo ""
	@echo "  make install    Install Node.js (via Homebrew) + npm dependencies"
	@echo "  make dev        Start the development server on http://localhost:$(PORT)"
	@echo "  make build      Validate questions + compile a production build"
	@echo "  make start      Serve the production build on http://localhost:$(PORT)"
	@echo "  make validate   Validate questions.json schema and domain counts"
	@echo "  make typecheck  Run TypeScript type-check (no emit)"
	@echo "  make test       Run validate + typecheck (full CI check)"
	@echo "  make clean      Remove .next build artefacts"
	@echo "  make stop       Stop the running dev/production server"
	@echo "  make kill-port  Kill any process occupying port $(PORT)"
	@echo ""

# ─── Install ──────────────────────────────────────────────────────────────────
install:
	@echo "→ Checking for Node.js..."
	@if ! command -v $(NODE_BIN) >/dev/null 2>&1; then \
		echo "  Node.js not found — installing via Homebrew..."; \
		/opt/homebrew/bin/brew install node; \
	else \
		echo "  Node.js $$($(NODE_BIN) --version) already installed."; \
	fi
	@echo "→ Installing npm dependencies..."
	$(NPM_BIN) install
	@echo "✓ Install complete."

# ─── Port management ──────────────────────────────────────────────────────────
kill-port:
	@PID=$$(lsof -ti :$(PORT)) ; \
	if [ -n "$$PID" ]; then \
		echo "→ Freeing port $(PORT) (PID $$PID)..."; \
		kill -9 $$PID; \
		sleep 1; \
	fi

# ─── Development ──────────────────────────────────────────────────────────────
dev: kill-port
	@echo "→ Starting dev server at http://localhost:$(PORT)"
	$(NEXT) dev --port $(PORT)

# ─── Production build ─────────────────────────────────────────────────────────
build: validate
	@echo "→ Building production bundle..."
	$(NEXT) build
	@echo "✓ Build complete."

start: kill-port
	@echo "→ Starting production server at http://localhost:$(PORT)"
	$(NEXT) start --port $(PORT)

stop:
	@PID=$$(lsof -ti :$(PORT)) ; \
	if [ -n "$$PID" ]; then \
		echo "→ Stopping server (PID $$PID) on port $(PORT)..."; \
		kill $$PID; \
		echo "✓ Server stopped."; \
	else \
		echo "  No server running on port $(PORT)."; \
	fi

# ─── Testing & Validation ─────────────────────────────────────────────────────
validate:
	@echo "→ Validating question bank..."
	$(TSX) scripts/validate-questions.ts
	@echo "✓ Question bank valid."

typecheck:
	@echo "→ Running TypeScript type-check..."
	$(TSC) --noEmit
	@echo "✓ No type errors."

test: validate typecheck
	@echo "✓ All checks passed."

# ─── Clean ────────────────────────────────────────────────────────────────────
clean:
	@echo "→ Removing .next build artefacts..."
	rm -rf .next
	@echo "✓ Clean complete."
