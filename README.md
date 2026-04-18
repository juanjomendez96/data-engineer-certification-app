# Databricks Certified Data Engineer Associate — Exam Simulator

**Live site:** [juanjomendez96.github.io/data-engineer-certification-app](https://juanjomendez96.github.io/data-engineer-certification-app)

A browser-based simulator for the **Databricks Certified Data Engineer Associate** exam. 45 questions, 90-minute countdown timer, weighted domain scoring, and a full review screen with explanations after each attempt.

---

## Features

- **45-question exam sessions** drawn via stratified random sampling across 5 official domains
- **90-minute countdown timer** sourced from wall-clock origin — immune to tab backgrounding and CPU throttling
- **Weighted scoring** — each domain contributes its official percentage weight to the final score, not a raw question count
- **70% passing threshold** applied to the weighted score
- **Session persistence** — progress is saved to `localStorage`; resuming a mid-exam session is supported
- **Syntax-highlighted code snippets** via Shiki (server-side, zero client JS)
- **Inline markdown in questions and options** — renders `**bold**`, `` `inline code` ``, and fenced code blocks (` ```sql ... ``` `)
- **Question review accordion** — see correct/incorrect answers and explanations after submission
- **Attempt history** — last 100 results stored locally, filterable by student name
- **Clear all attempts** button with inline confirmation on the landing page

---

## Exam Domain Weights

| Domain | Weight | Questions per session |
|---|---|---|
| Databricks Intelligence Platform | 15% | 7 |
| ETL & Data Ingestion | 20% | 9 |
| Data Processing & Transformations | 35% | 15 |
| Productionizing Data Pipelines | 20% | 9 |
| Data Governance & Quality | 10% | 5 |

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router, TypeScript strict) |
| Styling | Tailwind CSS |
| State management | Zustand + `persist` middleware |
| Syntax highlighting | Shiki (`codeToHtml`, server-side) |
| Schema validation | Zod |
| Toast notifications | Sonner |

---

## Project Structure

```
├── app/
│   ├── layout.tsx           # Root layout, font, Toaster
│   ├── page.tsx             # Landing page (start / resume / history / clear attempts)
│   ├── exam/page.tsx        # 90-minute exam session
│   ├── results/page.tsx     # Score breakdown
│   └── review/page.tsx      # Per-question review for a past attempt
│
├── components/
│   ├── CodeBlock.tsx        # Shiki RSC wrapper for fenced code in question text
│   ├── InlineMarkdown.tsx   # Renders **bold**, `code`, and ```fenced blocks``` in strings
│   ├── ExplanationMarkdown.tsx  # Markdown renderer for explanation text
│   ├── QuestionCard.tsx     # Question text + answer options
│   ├── QuestionPalette.tsx  # Desktop sidebar / mobile drawer
│   ├── ReviewAccordion.tsx  # Expandable question review with correct/wrong highlights
│   ├── TimerDisplay.tsx     # HH:MM:SS countdown
│   ├── ScoreGauge.tsx       # SVG semicircular gauge
│   ├── DomainBar.tsx        # Per-domain progress bar
│   └── ResumeDialog.tsx     # Resume vs. start-new modal
│
├── lib/
│   ├── types.ts             # TypeScript interfaces
│   ├── domainConfig.ts      # Domain weights and counts
│   ├── questionSchema.ts    # Zod schema for questions.json
│   ├── validateBank.ts      # Runtime bank validation
│   ├── sampler.ts           # Stratified random sampling
│   ├── scoring.ts           # Weighted score calculation
│   ├── timer.ts             # Timer utilities
│   └── utils.ts             # cn() helper
│
├── store/
│   └── examStore.ts         # Zustand store with localStorage persistence
│
├── data/
│   └── questions.json       # Question bank (200 questions, >= 45 required)
│
├── scripts/
│   └── validate-questions.ts  # CLI validation script
│
└── Makefile                 # All developer commands
```

---

## Prerequisites

- **macOS** with [Homebrew](https://brew.sh) installed
- Node.js — installed automatically by `make install` if not already present

---

## Quick Start

```bash
make install   # Install Node.js (via Homebrew) + npm dependencies
make dev       # Start dev server at http://localhost:3000
```

---

## All Make Commands

| Command | Description |
|---|---|
| `make install` | Install Node.js via Homebrew (if missing) and run `npm install` |
| `make dev` | Start the development server at `http://localhost:3000` |
| `make build` | Validate question bank, then compile static export to `out/` |
| `make start` | Serve the production build at `http://localhost:3000` |
| `make stop` | Stop the running dev/production server |
| `make deploy` | Run `test` + `build`, then commit and push to `master` |
| `make validate` | Validate `questions.json` schema and per-domain question counts |
| `make typecheck` | Run TypeScript type-check with no output emit |
| `make test` | Run `validate` + `typecheck` — full CI gate |
| `make clean` | Remove `.next` and `out/` build artefacts |
| `make clear-history` | Open the browser to clear all stored exam attempts |
| `make kill-port` | Kill any process occupying port 3000 |

---

## Deployment — GitHub Pages

The app deploys automatically to GitHub Pages on every push to `master` via GitHub Actions (`.github/workflows/deploy.yml`).

The workflow:
1. Installs dependencies with `npm ci`
2. Validates `questions.json` with `npm run validate:questions`
3. Compiles a static export (`next build` → `out/`)
4. Deploys the `out/` directory to the `github-pages` environment

To trigger a deployment manually:

```bash
make deploy
```

> **First-time setup:** In the GitHub repository go to **Settings → Pages** and set the source to **GitHub Actions**.

**Live URL:** `https://juanjomendez96.github.io/data-engineer-certification-app`

---

## Question Bank

Questions live in `data/questions.json`. Each entry must conform to this schema:

```json
{
  "id": "q001",
  "domain": "data_processing",
  "subtopics": ["delta-lake", "time-travel"],
  "difficulty": 2,
  "text": "Question text with optional **bold** or `inline code`.",
  "code": {
    "snippet": "SELECT * FROM events TIMESTAMP AS OF '2024-01-01'",
    "language": "sql"
  },
  "options": [
    "Plain text option",
    "```sql\nSELECT * FROM t1\nUNION\nSELECT * FROM t2```",
    "Option C",
    "Option D"
  ],
  "answer": 1,
  "explanation": "Explanation of the correct answer."
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Must match `/^q\d{3}$/` — e.g. `q001`, `q099` |
| `domain` | `enum` | `platform` · `etl_ingestion` · `data_processing` · `productionizing` · `governance` |
| `subtopics` | `string[]` | At least one required |
| `difficulty` | `1 \| 2 \| 3` | 1 = easy, 2 = medium, 3 = hard |
| `text` | `string` | Supports `**bold**` and `` `inline code` `` markdown |
| `code` | `object?` | Optional — `snippet` (raw source) + `language` (`python` · `sql` · `bash` · `scala`). Rendered as a syntax-highlighted block above the options. |
| `options` | `[string, string, string, string]` | Exactly 4 strings. Supports `**bold**`, `` `inline code` ``, and fenced code blocks (` ```lang\ncode``` `) |
| `answer` | `0 \| 1 \| 2 \| 3` | Zero-based index into `options` |
| `explanation` | `string` | Shown in the review accordion after submission |
| `source` | `string?` | Optional provenance tag |

### Minimum question counts per domain

| Domain key | Minimum |
|---|---|
| `platform` | 7 |
| `etl_ingestion` | 9 |
| `data_processing` | 15 |
| `productionizing` | 9 |
| `governance` | 5 |

Run `make validate` after any edits to verify the schema and domain counts before committing.

---

## Scoring

The final score is a **weighted sum** across domains, not a raw percentage:

```
weighted_score = Σ (domain_correct / domain_total) × domain_weight
```

The 70% pass threshold is applied to `weighted_score`, not to `total_correct / 45`.

---

## localStorage Keys

| Key | Contents |
|---|---|
| `examSession` | Active exam session (managed by Zustand `persist`) |
| `examHistory` | Last 100 attempt summaries |

Attempts can be cleared from the landing page using the **Clear all** button in the Recent Attempts section, or from the terminal with `make clear-history`.

---

## Contributing

1. Fork the repo and create a branch from `master`
2. Run `make install` to set up dependencies
3. Add or edit questions in `data/questions.json` following the schema above
4. Run `make test` to validate the question bank and check types
5. Open a PR — the CI workflow will run the same checks automatically
