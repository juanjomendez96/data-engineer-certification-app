NODE_BIN   := /opt/homebrew/bin/node
NPM_BIN    := /opt/homebrew/bin/npm
NEXT       := node node_modules/next/dist/bin/next
TSX        := node node_modules/.bin/tsx
TSC        := node node_modules/typescript/bin/tsc
PORT       := 3000
REPO       := juanjomendez96/data-engineer-certification-app
PAGES_URL  := https://juanjomendez96.github.io/data-engineer-certification-app

export PATH := /opt/homebrew/bin:$(PATH)

# ─── Default ──────────────────────────────────────────────────────────────────
.DEFAULT_GOAL := help

.PHONY: help install dev build export start stop deploy validate typecheck test clean kill-port

help:
	@echo ""
	@echo "  Databricks Exam Simulator — available targets:"
	@echo ""
	@echo "  make install    Install Node.js (via Homebrew) + npm dependencies"
	@echo "  make dev        Start the development server on http://localhost:$(PORT)"
	@echo "  make build      Validate questions + compile static export (out/)"
	@echo "  make start      Serve the production build on http://localhost:$(PORT)"
	@echo "  make stop       Stop the running dev/production server"
	@echo "  make deploy     Commit + push to main → triggers GitHub Pages deploy"
	@echo "  make validate   Validate questions.json schema and domain counts"
	@echo "  make typecheck  Run TypeScript type-check (no emit)"
	@echo "  make test       Run validate + typecheck (full CI check)"
	@echo "  make clean      Remove .next and out/ build artefacts"
	@echo "  make kill-port  Kill any process occupying port $(PORT)"
	@echo ""
	@echo "  Live site → $(PAGES_URL)"
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

# ─── Production build (static export for GitHub Pages) ────────────────────────
build: validate
	@echo "→ Building static export..."
	NODE_ENV=production $(NEXT) build
	@echo "✓ Static export written to out/"

start: kill-port
	@echo "→ Serving production build at http://localhost:$(PORT)"
	@echo "  (uses npx serve — install with: npm i -g serve)"
	npx serve out -p $(PORT)

stop:
	@PID=$$(lsof -ti :$(PORT)) ; \
	if [ -n "$$PID" ]; then \
		echo "→ Stopping server (PID $$PID) on port $(PORT)..."; \
		kill $$PID; \
		echo "✓ Server stopped."; \
	else \
		echo "  No server running on port $(PORT)."; \
	fi

# ─── GitHub Pages deploy ──────────────────────────────────────────────────────
deploy:
	@echo "→ Staging all changes..."
	git add -A
	@if git diff --cached --quiet; then \
		echo "  Nothing to commit — pushing existing HEAD."; \
	else \
		git commit -m "deploy: update application"; \
	fi
	@echo "→ Pushing to main..."
	git push origin master
	@echo "✓ Push complete. GitHub Actions will build and deploy."
	@echo "  Live at: $(PAGES_URL)"

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
	@echo "→ Removing build artefacts..."
	rm -rf .next out
	@echo "✓ Clean complete."
