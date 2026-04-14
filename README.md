# Databricks Certified Data Engineer Associate — Exam Simulator

A single-page web application that simulates the **Databricks Certified Data Engineer Associate** exam. 45 questions, 90-minute countdown timer, weighted domain scoring, and a full per-domain breakdown on the results screen.

---

## Features

- **45-question exam sessions** drawn via stratified random sampling across 5 official domains
- **90-minute countdown timer** sourced from wall-clock origin — immune to tab backgrounding and CPU throttling
- **Weighted scoring** — each domain contributes its official percentage weight to the final score, not a raw question count
- **70% passing threshold** applied to the weighted score
- **Session persistence** — progress is saved to `localStorage`; resuming a mid-exam session is supported
- **Syntax-highlighted code snippets** via Shiki (server-side, zero client JS)
- **Question review accordion** — see correct/incorrect answers and explanations after submission
- **Attempt history** — last 20 results stored locally

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
| Framework | Next.js 14 (App Router, TypeScript strict) |
| Styling | Tailwind CSS |
| State management | Zustand + `persist` middleware |
| Syntax highlighting | Shiki (`codeToHtml`, server-side) |
| Schema validation | Zod |
| Toast notifications | Sonner |

---

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout, font, Toaster
│   ├── page.tsx            # Landing page (start / resume / history)
│   ├── exam/page.tsx       # 90-minute exam session
│   └── results/page.tsx    # Score breakdown + review accordion
│
├── components/
│   ├── CodeBlock.tsx        # Shiki RSC wrapper
│   ├── QuestionCard.tsx     # Question text + options
│   ├── QuestionPalette.tsx  # Desktop sidebar / mobile drawer
│   ├── TimerDisplay.tsx     # HH:MM:SS countdown
│   ├── ScoreGauge.tsx       # SVG semicircular gauge
│   ├── DomainBar.tsx        # Per-domain progress bar
│   ├── ReviewAccordion.tsx  # Expandable question review
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
│   └── questions.json       # Question bank (>= 45 questions required)
│
├── scripts/
│   └── validate-questions.ts  # CLI validation script
│
└── Makefile                 # All developer commands
```

---

## Prerequisites

- **macOS** with [Homebrew](https://brew.sh) installed
- Node.js is installed automatically by `make install` if not already present

---

## Quick Start

```bash
make install   # Install Node.js + npm dependencies
make dev       # Start dev server at http://localhost:3000
```

---

## Make Commands

| Command | Description |
|---|---|
| `make install` | Install Node.js via Homebrew (if missing) and run `npm install` |
| `make dev` | Start the development server at `http://localhost:3000` |
| `make build` | Validate question bank, then compile a production bundle |
| `make start` | Serve the production build at `http://localhost:3000` |
| `make validate` | Validate `questions.json` schema and per-domain question counts |
| `make typecheck` | Run TypeScript type-check with no output emit |
| `make test` | Run `validate` + `typecheck` — full CI gate |
| `make clean` | Remove `.next` build artefacts |

---

## Question Bank

Questions live in `data/questions.json`. Each entry must conform to this schema:

```json
{
  "id": "q001",
  "domain": "data_processing",
  "subtopics": ["delta-lake", "time-travel"],
  "difficulty": 2,
  "text": "Question text here.",
  "code": {
    "snippet": "SELECT * FROM events TIMESTAMP AS OF ...",
    "language": "sql"
  },
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": 2,
  "explanation": "Explanation of the correct answer."
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Must match `/^q\d{3}$/` — e.g. `q001`, `q099` |
| `domain` | `enum` | `platform` · `etl_ingestion` · `data_processing` · `productionizing` · `governance` |
| `subtopics` | `string[]` | At least one required |
| `difficulty` | `1 \| 2 \| 3` | 1 = easy, 2 = medium, 3 = hard |
| `text` | `string` | Min 10 characters |
| `code` | `object?` | Optional — `snippet` (raw source) + `language` (`python` · `sql` · `bash` · `scala`) |
| `options` | `[string, string, string, string]` | Exactly 4 strings |
| `answer` | `0 \| 1 \| 2 \| 3` | Zero-based index into `options` |
| `explanation` | `string` | Shown in review accordion after submission |
| `source` | `string?` | Optional provenance tag |

### Minimum question counts per domain

| Domain key | Minimum |
|---|---|
| `platform` | 7 |
| `etl_ingestion` | 9 |
| `data_processing` | 15 |
| `productionizing` | 9 |
| `governance` | 5 |

Run `make validate` after any edits to the question bank to verify the counts and schema before starting the app.

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
| `examHistory` | Last 20 attempt summaries |
