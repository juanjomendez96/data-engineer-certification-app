# Databricks Data Engineer Associate Exam Simulator — Technical Specification

**Version:** 1.0  
**Date:** 2026-04-14  
**Status:** Authoritative — do not write application code until this document is finalized

---

## 1. Product Overview

A single-page web application that simulates the Databricks Certified Data Engineer Associate exam: 45 questions, 90 minutes, a 70% weighted passing threshold, and full per-domain score breakdown on the results screen. No backend. No authentication. No practice mode. One path: Landing → Exam → Results.

---

## 2. Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14+ (App Router, TypeScript) | SSR-compatible Shiki highlighting via RSC, built-in routing, Vercel deploy |
| Language | TypeScript (strict mode) | Full type safety across question schema, store, and components |
| Styling | Tailwind CSS + shadcn/ui | Utility-first, Databricks-themed palette, accessible components |
| State management | Zustand + `zustand/middleware` `persist` | Lightweight, no boilerplate, localStorage sync built-in |
| Syntax highlighting | Shiki (`codeToHtml`) | Server-side rendering in RSC, zero client JS for highlighting, VS Code themes |
| Schema validation | Zod | Runtime + CI validation of `questions.json` |
| Toast notifications | `sonner` (works with Next.js App Router) | Lightweight, accessible toasts for timer warnings |

---

## 3. Project Directory Structure

```
/
├── app/
│   ├── layout.tsx              # Root layout: font, theme provider, Toaster
│   ├── page.tsx                # Landing page: start exam, resume dialog, history
│   ├── exam/
│   │   └── page.tsx            # 90-minute exam session (client component)
│   └── results/
│       └── page.tsx            # Score breakdown + question review accordion
│
├── components/
│   ├── CodeBlock.tsx           # Shiki RSC wrapper → dangerouslySetInnerHTML
│   ├── QuestionCard.tsx        # Question text + code + 4 option buttons
│   ├── QuestionPalette.tsx     # Desktop sidebar / mobile bottom drawer
│   ├── TimerDisplay.tsx        # Countdown HH:MM:SS, red when < 5 min
│   ├── DomainBar.tsx           # Single horizontal progress bar for results
│   ├── ScoreGauge.tsx          # SVG circular gauge (pass=green, fail=red)
│   ├── ReviewAccordion.tsx     # Expandable per-question review rows
│   └── ResumeDialog.tsx        # Modal: resume vs. start fresh
│
├── lib/
│   ├── types.ts                # DomainKey, Language, Question, ExamSession, ExamResult
│   ├── questionSchema.ts       # Zod schema (QuestionSchema, QuestionBankSchema)
│   ├── domainConfig.ts         # DOMAIN_CONFIG: weights, counts, display names
│   ├── sampler.ts              # sampleExam(): proportional stratified sampling
│   ├── scoring.ts              # scoreSession(): weighted domain scoring
│   ├── timer.ts                # computeRemaining(), formatTime()
│   └── validateBank.ts         # validateBank(): throws if domain pool is short
│
├── store/
│   └── examStore.ts            # Zustand store with persist middleware
│
├── data/
│   └── questions.json          # Canonical question bank (>= 92 questions)
│
├── scripts/
│   └── validate-questions.ts   # CLI: node -r ts-node/register scripts/validate-questions.ts
│
└── public/
    └── favicon.ico
```

---

## 4. Question Bank JSON Schema

### 4.1 TypeScript Types (`lib/types.ts`)

```typescript
export type DomainKey =
  | 'platform'
  | 'etl_ingestion'
  | 'data_processing'
  | 'productionizing'
  | 'governance';

export type Language = 'python' | 'sql' | 'bash' | 'scala';

export interface Question {
  id: string;           // Regex: /^q\d{3}$/ — e.g., 'q001', 'q099'
  domain: DomainKey;
  subtopics: string[];  // Min 1. e.g., ['delta-lake', 'time-travel']
  difficulty: 1 | 2 | 3; // 1=easy, 2=medium, 3=hard
  text: string;         // Min 10 chars. Plain text or inline markdown (bold, code ticks).
  code?: {
    snippet: string;    // Raw source code string (no fence markers)
    language: Language;
  };
  options: [string, string, string, string]; // Exactly 4 plain-text strings
  answer: 0 | 1 | 2 | 3; // Index into options[]
  explanation: string;  // Min 10 chars. Shown in review accordion after submit.
  source?: string;      // Optional provenance tag, e.g., 'official-sample', 'community'
}

export interface ExamSession {
  startTimestamp: number;       // Date.now() when exam was started
  questionIds: string[];        // Ordered array of 45 question IDs (post-sampling)
  answers: Record<string, number>; // { [questionId]: selectedOptionIndex }
  flags: Record<string, boolean>;  // { [questionId]: true } for flagged questions
  currentIndex: number;         // 0-based index of currently displayed question
}

export interface DomainResult {
  correct: number;
  total: number;
  percentage: number;   // correct / total * 100
  weight: number;       // Official domain weight (0.0–1.0)
}

export interface ExamResult {
  weightedScore: number;            // 0.0–1.0, weighted sum across domains
  percentage: number;               // weightedScore * 100, displayed as "74.3%"
  passed: boolean;                  // weightedScore >= 0.70
  totalCorrect: number;             // Raw count
  totalQuestions: number;           // Always 45
  domains: Record<DomainKey, DomainResult>;
  questionIds: string[];            // Ordered question list (for review)
  answers: Record<string, number>;  // User's submitted answers
  durationSeconds: number;          // Elapsed seconds at submission
  answeredAt: number;               // Date.now() at submission
  expired: boolean;                 // true if auto-submitted by timer
}

export interface HistoryEntry {
  answeredAt: number;
  percentage: number;
  passed: boolean;
  durationSeconds: number;
}
```

### 4.2 Zod Schema (`lib/questionSchema.ts`)

```typescript
import { z } from 'zod';

const DomainKeySchema = z.enum([
  'platform', 'etl_ingestion', 'data_processing',
  'productionizing', 'governance'
]);

const LanguageSchema = z.enum(['python', 'sql', 'bash', 'scala']);

export const QuestionSchema = z.object({
  id: z.string().regex(/^q\d{3}$/, 'ID must match /^q\\d{3}$/'),
  domain: DomainKeySchema,
  subtopics: z.array(z.string()).min(1, 'At least one subtopic required'),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  text: z.string().min(10, 'Question text too short'),
  code: z.object({
    snippet: z.string().min(1),
    language: LanguageSchema,
  }).optional(),
  options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  answer: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  explanation: z.string().min(10, 'Explanation too short'),
  source: z.string().optional(),
});

export const QuestionBankSchema = z.array(QuestionSchema);
export type Question = z.infer<typeof QuestionSchema>;
```

### 4.3 Example Question (fully valid JSON)

```json
{
  "id": "q001",
  "domain": "data_processing",
  "subtopics": ["delta-lake", "time-travel"],
  "difficulty": 2,
  "text": "A data engineer needs to query a Delta table as it existed 48 hours ago. Which SQL syntax accomplishes this?",
  "code": {
    "snippet": "SELECT * FROM events TIMESTAMP AS OF '2024-01-01 00:00:00'\nSELECT * FROM events VERSION AS OF 42\nSELECT * FROM delta.`/path/to/events`@v42\nSELECT * FROM events AT (TIMESTAMP => '2024-01-01')",
    "language": "sql"
  },
  "options": [
    "SELECT * FROM events TIMESTAMP AS OF date_sub(now(), 2)",
    "SELECT * FROM events VERSION AS OF (now() - INTERVAL 48 HOURS)",
    "SELECT * FROM events TIMESTAMP AS OF (current_timestamp() - INTERVAL 48 HOURS)",
    "SELECT * FROM events AT (timestamp => current_timestamp() - INTERVAL 48 HOURS)"
  ],
  "answer": 2,
  "explanation": "Delta Lake's time travel TIMESTAMP AS OF accepts a timestamp expression. Using current_timestamp() - INTERVAL 48 HOURS correctly computes the target time dynamically. The VERSION AS OF form requires a known version number, not a time offset.",
  "source": "official-sample"
}
```

---

## 5. Domain Configuration (`lib/domainConfig.ts`)

```typescript
export type DomainKey = 'platform' | 'etl_ingestion' | 'data_processing' | 'productionizing' | 'governance';

export interface DomainMeta {
  displayName: string;
  weight: number;   // Official exam weight (0.0–1.0)
  count: number;    // Questions sampled per exam session
}

/**
 * Official Databricks Data Engineer Associate domain weights.
 * Counts sum to exactly 45:
 *   7 + 9 + 15 + 9 + 5 = 45
 *
 * Data processing uses 15 (floor of 35% × 45 = 15.75)
 * to avoid overcount. This is a 33.3% effective weight,
 * still the largest domain. Document this in README.
 */
export const DOMAIN_CONFIG: Record<DomainKey, DomainMeta> = {
  platform: {
    displayName: 'Databricks Intelligence Platform',
    weight: 0.15,
    count: 7,
  },
  etl_ingestion: {
    displayName: 'ETL & Data Ingestion',
    weight: 0.20,
    count: 9,
  },
  data_processing: {
    displayName: 'Data Processing & Transformations',
    weight: 0.35,
    count: 15,
  },
  productionizing: {
    displayName: 'Productionizing Data Pipelines',
    weight: 0.20,
    count: 9,
  },
  governance: {
    displayName: 'Data Governance & Quality',
    weight: 0.10,
    count: 5,
  },
};

export const TOTAL_QUESTIONS = Object.values(DOMAIN_CONFIG)
  .reduce((sum, d) => sum + d.count, 0); // Must equal 45
```

### 5.1 Official Exam Domain Topics (for question tagging reference)

| Domain | Key Subtopics |
|---|---|
| Databricks Intelligence Platform | lakehouse architecture, delta lake architecture, unity catalog overview, databricks workspace, clusters, dbfs, repos |
| ETL & Data Ingestion | auto loader, copy into, structured streaming, kafka integration, bronze/silver/gold layers, external tables |
| Data Processing & Transformations | delta lake CRUD, merge, z-ordering, optimize, vacuum, time travel, change data feed, spark dataframe API, PySpark, higher-order functions, SQL UDFs, DLT pipelines, `@dlt.table`, `@dlt.view`, `@dlt.append_flow`, expectations |
| Productionizing Data Pipelines | job scheduling, multi-task workflows, task dependencies, DLT pipeline modes (triggered vs continuous), notebook workflows, job parameters, alerts |
| Data Governance & Quality | unity catalog hierarchy (metastore→catalog→schema→table), row/column filters, data lineage, tags, grants, privileges, audit logs |

---

## 6. Sampling Algorithm (`lib/sampler.ts`)

```typescript
import questionsRaw from '../data/questions.json';
import { DOMAIN_CONFIG, DomainKey } from './domainConfig';
import { Question } from './types';
import { validateBank } from './validateBank';

// Fisher-Yates shuffle — cryptographically non-essential
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const bank = questionsRaw as Question[];

// Validate once at module load time (throws in dev; caught by CI script in prod)
validateBank(bank);

export function sampleExam(): Question[] {
  const sampled: Question[] = [];
  for (const [domain, { count }] of Object.entries(DOMAIN_CONFIG)) {
    const pool = bank.filter(q => q.domain === (domain as DomainKey));
    sampled.push(...shuffle(pool).slice(0, count));
  }
  // Final shuffle to interleave domains (user does not see domain grouping)
  return shuffle(sampled);
}
```

**Invariants enforced:**
- Domain order is hidden from user (final `shuffle` interleaves all 45).
- `validateBank` ensures no domain can produce fewer than `count` items.
- `sampleExam()` is called exactly once per exam start. The resulting `questionIds` array is stored in `ExamSession` and never regenerated.

---

## 7. Bank Validation (`lib/validateBank.ts`)

```typescript
import { DOMAIN_CONFIG, DomainKey } from './domainConfig';
import { Question } from './types';

export function validateBank(bank: Question[]): void {
  const errors: string[] = [];
  const ids = bank.map(q => q.id);
  const uniqueIds = new Set(ids);

  if (uniqueIds.size !== ids.length) {
    errors.push(`Duplicate question IDs detected.`);
  }

  for (const [domain, { count }] of Object.entries(DOMAIN_CONFIG)) {
    const pool = bank.filter(q => q.domain === (domain as DomainKey));
    if (pool.length < count) {
      errors.push(
        `Domain '${domain}' requires ${count} questions but only ${pool.length} are available.`
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Question bank validation failed:\n${errors.join('\n')}`);
  }
}
```

---

## 8. Scoring Algorithm (`lib/scoring.ts`)

```typescript
import { DOMAIN_CONFIG, DomainKey } from './domainConfig';
import { ExamSession, ExamResult, DomainResult } from './types';
import questionsRaw from '../data/questions.json';
import { Question } from './types';

const bank = questionsRaw as Question[];
const bankMap = new Map(bank.map(q => [q.id, q]));

export function scoreSession(
  session: ExamSession,
  expiredByTimer = false
): ExamResult {
  const questions = session.questionIds.map(id => bankMap.get(id)!);

  const domainResults = {} as Record<DomainKey, DomainResult>;
  let totalCorrect = 0;

  for (const [domain, { weight }] of Object.entries(DOMAIN_CONFIG)) {
    const domainQs = questions.filter(q => q.domain === domain);
    const correct = domainQs.filter(
      q => session.answers[q.id] === q.answer
    ).length;
    totalCorrect += correct;
    domainResults[domain as DomainKey] = {
      correct,
      total: domainQs.length,
      percentage: domainQs.length > 0 ? (correct / domainQs.length) * 100 : 0,
      weight,
    };
  }

  // Weighted score: sum of (domain_correct / domain_total) * domain_weight
  const weightedScore = Object.entries(domainResults).reduce(
    (sum, [, r]) => sum + (r.total > 0 ? (r.correct / r.total) * r.weight : 0),
    0
  );

  const durationSeconds = Math.min(
    (Date.now() - session.startTimestamp) / 1000,
    5400 // cap at 90 min
  );

  return {
    weightedScore,
    percentage: parseFloat((weightedScore * 100).toFixed(1)),
    passed: weightedScore >= 0.70,
    totalCorrect,
    totalQuestions: 45,
    domains: domainResults,
    questionIds: session.questionIds,
    answers: session.answers,
    durationSeconds,
    answeredAt: Date.now(),
    expired: expiredByTimer,
  };
}
```

**Scoring notes:**
- Unanswered questions count as incorrect (no answer key match).
- Weighted score is NOT `(totalCorrect / 45)`. It is the proper weighted sum so that each domain contributes its official percentage to the final score.
- The 70% pass threshold applies to `weightedScore`, not raw percentage.
- Mathematical identity: if sampling is perfectly proportional, `weightedScore ≈ totalCorrect / 45`. They will differ slightly due to count rounding in `DOMAIN_CONFIG`.

---

## 9. Zustand Store (`store/examStore.ts`)

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ExamSession, ExamResult } from '../lib/types';
import { sampleExam } from '../lib/sampler';
import { scoreSession } from '../lib/scoring';

interface ExamStore {
  // Session state (persisted to localStorage key 'examSession')
  session: ExamSession | null;

  // Derived result (NOT persisted — computed on submit, passed to results page via URL)
  lastResult: ExamResult | null;

  // Actions
  startExam: () => void;
  resumeExam: () => void;   // no-op; session already in store
  abandonExam: () => void;  // clears session without scoring
  setAnswer: (questionId: string, optionIndex: number) => void;
  flagQuestion: (questionId: string) => void;
  setCurrentIndex: (index: number) => void;
  submitExam: (expired?: boolean) => ExamResult;
}

export const useExamStore = create<ExamStore>()(
  persist(
    (set, get) => ({
      session: null,
      lastResult: null,

      startExam: () => {
        const questions = sampleExam();
        set({
          session: {
            startTimestamp: Date.now(),
            questionIds: questions.map(q => q.id),
            answers: {},
            flags: {},
            currentIndex: 0,
          },
          lastResult: null,
        });
      },

      abandonExam: () => set({ session: null }),

      setAnswer: (questionId, optionIndex) =>
        set(state => ({
          session: state.session
            ? {
                ...state.session,
                answers: { ...state.session.answers, [questionId]: optionIndex },
              }
            : null,
        })),

      flagQuestion: (questionId) =>
        set(state => ({
          session: state.session
            ? {
                ...state.session,
                flags: {
                  ...state.session.flags,
                  [questionId]: !state.session.flags[questionId],
                },
              }
            : null,
        })),

      setCurrentIndex: (index) =>
        set(state => ({
          session: state.session ? { ...state.session, currentIndex: index } : null,
        })),

      submitExam: (expired = false) => {
        const { session } = get();
        if (!session) throw new Error('No active session');
        const result = scoreSession(session, expired);
        // Persist history entry
        const historyRaw = localStorage.getItem('examHistory') ?? '[]';
        const history = JSON.parse(historyRaw) as Array<{
          answeredAt: number; percentage: number; passed: boolean; durationSeconds: number;
        }>;
        history.unshift({
          answeredAt: result.answeredAt,
          percentage: result.percentage,
          passed: result.passed,
          durationSeconds: result.durationSeconds,
        });
        localStorage.setItem('examHistory', JSON.stringify(history.slice(0, 20)));
        // Clear session, store result temporarily
        set({ session: null, lastResult: result });
        return result;
      },
    }),
    {
      name: 'examSession',          // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Only persist session state; lastResult is ephemeral
      partialize: (state) => ({ session: state.session }),
    }
  )
);
```

**Store invariants:**
- `session` is `null` at rest (no active exam) or while on results/landing.
- `submitExam()` clears `session` immediately to prevent double-submit.
- `lastResult` lives only in memory; if user refreshes results page without a valid `lastResult`, they are redirected to landing.
- History is written to `localStorage.examHistory` inside `submitExam()`, not in a separate effect.

---

## 10. Timer Architecture

### 10.1 `lib/timer.ts`

```typescript
export const EXAM_DURATION_SECONDS = 5400; // 90 * 60

export function computeRemaining(startTimestamp: number): number {
  const elapsed = (Date.now() - startTimestamp) / 1000;
  return Math.max(0, EXAM_DURATION_SECONDS - elapsed);
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
```

### 10.2 `useTimer` hook (inside `/app/exam/page.tsx`)

```typescript
'use client';
import { useEffect, useRef, useState } from 'react';
import { computeRemaining } from '@/lib/timer';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useExamStore } from '@/store/examStore';

export function useTimer(startTimestamp: number | null) {
  const [remaining, setRemaining] = useState<number>(
    startTimestamp ? computeRemaining(startTimestamp) : 0
  );
  const warned30 = useRef(false);
  const submitted = useRef(false);
  const router = useRouter();
  const submitExam = useExamStore(s => s.submitExam);

  useEffect(() => {
    if (!startTimestamp) return;
    const interval = setInterval(() => {
      const r = computeRemaining(startTimestamp);
      setRemaining(r);

      if (r <= 30 && !warned30.current) {
        warned30.current = true;
        toast.warning('30 seconds remaining!', { duration: 10000 });
      }

      if (r <= 0 && !submitted.current) {
        submitted.current = true;
        clearInterval(interval);
        submitExam(true); // expired = true
        router.push('/results?expired=true');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTimestamp]);

  return remaining;
}
```

**Timer design decisions:**
- Uses `startTimestamp` (wall-clock origin) not a countdown counter. Immune to tab backgrounding, CPU throttling, and setTimeout drift.
- `setInterval` at 1s is display-only. The authoritative elapsed time is always `Date.now() - startTimestamp`.
- Guard refs (`warned30`, `submitted`) prevent duplicate side effects from React StrictMode double-invocations.
- `computeRemaining` is called every tick; the interval itself does not accumulate error.

---

## 11. Session Resume Logic (`app/page.tsx`)

On landing page mount:

```typescript
'use client';
import { useEffect, useState } from 'react';
import { useExamStore } from '@/store/examStore';
import { computeRemaining, EXAM_DURATION_SECONDS } from '@/lib/timer';
import { scoreSession } from '@/lib/scoring';
import { useRouter } from 'next/navigation';

type ResumeState = 'none' | 'resumable' | 'expired-pending';

export default function LandingPage() {
  const session = useExamStore(s => s.session);
  const startExam = useExamStore(s => s.startExam);
  const abandonExam = useExamStore(s => s.abandonExam);
  const submitExam = useExamStore(s => s.submitExam);
  const [resumeState, setResumeState] = useState<ResumeState>('none');
  const [remainingAtLoad, setRemainingAtLoad] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!session) { setResumeState('none'); return; }
    const remaining = computeRemaining(session.startTimestamp);
    if (remaining > 0) {
      setRemainingAtLoad(remaining);
      setResumeState('resumable');
    } else {
      // Session expired while user was away — auto-submit silently
      setResumeState('expired-pending');
      submitExam(true);
      router.push('/results?expired=true');
    }
  }, []);
  // ...
}
```

**Resume dialog behavior:**
- Shown only when `resumeState === 'resumable'`.
- Displays remaining time at load (e.g., "You have 34:22 remaining").
- "Resume Exam" → `router.push('/exam')`.
- "Start New Exam" → `abandonExam()`, then `startExam()`, then `router.push('/exam')`.
- If session was expired at load time: silently auto-submit and redirect to `/results?expired=true` with no dialog.

---

## 12. Syntax Highlighting (`components/CodeBlock.tsx`)

```typescript
// Server component — no 'use client' directive
import { codeToHtml } from 'shiki';
import type { Language } from '@/lib/types';

interface CodeBlockProps {
  snippet: string;
  language: Language;
}

export async function CodeBlock({ snippet, language }: CodeBlockProps) {
  const html = await codeToHtml(snippet, {
    lang: language === 'sql' ? 'sql' : language, // shiki uses 'python', 'sql', 'bash', 'scala'
    theme: 'github-dark',
  });

  return (
    <div
      className="rounded-md overflow-x-auto text-sm my-4 border border-slate-700"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

**Constraints:**
- `CodeBlock` must remain a Server Component (async). It cannot be used inside client components directly.
- For use in `QuestionCard` (client component): wrap in a parent Server Component that pre-renders the highlighted HTML and passes it as a `highlightedHtml: string` prop to the client card.
- Shiki renders `<pre><code>` with inline styles (no external CSS dependency).
- Languages supported: `python`, `sql`, `bash`, `scala`. All are first-class Shiki grammars.

---

## 13. Exam Page Layout (`/app/exam/page.tsx`)

```
Desktop (>= 768px):
+-------------------------------------------+------------------+
|  Question 12 of 45   |   Time: 01:23:45   |                  |
+-------------------------------------------+  PALETTE         |
|                                           |  [1✓][2✓][3-]    |
|  Question text (markdown rendered)        |  [4✗][5-][6✓]    |
|                                           |  ...             |
|  ┌──────────────────────────────┐        |  [43-][44-][45-] |
|  │  code snippet (Shiki)        │        |                  |
|  └──────────────────────────────┘        |  Legend:         |
|                                           |  ■ unanswered    |
|  ○ A. Option text                         |  ■ answered      |
|  ○ B. Option text                         |  ▤ flagged       |
|  ● C. Option text  (selected)             |                  |
|  ○ D. Option text                         |  [Submit Exam]   |
|                                           |                  |
+---[Prev]----[Flag ⚑]----[Next]----------+------------------+

Mobile (< 768px):
+------------------------------------+
|  Q12/45  |  01:23:45   | [☰ palette]|
+------------------------------------+
|  Question text                     |
|  [code block]                      |
|  ○ A. Option                       |
|  ○ B. Option                       |
|  ● C. Option (selected)            |
|  ○ D. Option                       |
+------------------------------------+
| [← Prev] [Flag ⚑] [Next →]        |
+------------------------------------+
[Jump to Question ↑]  ← floating FAB

// Bottom drawer (slides up on FAB click):
+------------------------------------+
| [1✓][2✓][3-][4✗][5-]...[45-]     |
| [Submit Exam]                      |
+------------------------------------+
```

### 13.1 Option Button States

| State | Visual |
|---|---|
| Unselected | `bg-slate-800 border-slate-600 text-slate-200` |
| Selected (current) | `bg-slate-700 border-red-500 text-white ring-2 ring-red-500` |
| Hover (unselected) | `hover:border-slate-400` |

Options are never highlighted correct/incorrect during the exam. That only appears in the results review accordion.

### 13.2 Palette Slot States

| State | CSS |
|---|---|
| Unanswered | `bg-slate-700 text-slate-400` |
| Answered | `bg-red-600 text-white` |
| Flagged | `bg-yellow-500 text-black` |
| Current question | ring outline `ring-2 ring-white` |

---

## 14. Results Page (`/app/results/page.tsx`)

### 14.1 Data Flow

- `useExamStore(s => s.lastResult)` is the primary source.
- If `lastResult` is `null` on mount (user navigated directly to `/results`), redirect to `/`.
- `?expired=true` query param adds the "Time expired — exam auto-submitted" warning banner above the score gauge.

### 14.2 Layout

```
+-----------------------------------------------------------+
| [⚠ Time expired — exam auto-submitted]   (if expired)    |
+-----------------------------------------------------------+
|   [PASS / FAIL]     Your Score: 74.3%                    |
|   [SVG Gauge]       Passing threshold: 70.0%             |
|                     Answered: 34/45 correct              |
|                     Duration: 1h 23m 14s                 |
+-----------------------------------------------------------+
| Domain Breakdown                                          |
| Databricks Intelligence Platform (15%)                   |
|   [============----]  80.0%  ✓                           |
| ETL & Data Ingestion (20%)                               |
|   [=========-------]  62.5%  ✗  ← below 70%            |
| Data Processing & Transformations (35%)                  |
|   [================]  88.0%  ✓                           |
| Productionizing Data Pipelines (20%)                     |
|   [=========-------]  65.0%  ✗                           |
| Data Governance & Quality (10%)                          |
|   [=============---]  75.0%  ✓                           |
+-----------------------------------------------------------+
| Question Review (45 questions)              [Expand All] |
|                                                           |
| [Q1] ✓  Which Delta Lake command compacts...             |
| [Q2] ✗  When using DLT pipelines, which...  ▼ expanded  |
|   Question text...                                        |
|   ⨯ Your answer:  A. @dlt.table                         |
|   ✓ Correct:      B. @dlt.append_flow                   |
|   [code block re-highlighted]                            |
|   Explanation: @dlt.append_flow is used for...           |
| [Q3] ✓  What is the purpose of VACUUM...                 |
| ...                                                       |
+-----------------------------------------------------------+
| [Start New Exam]                                         |
+-----------------------------------------------------------+
```

### 14.3 Score Gauge

Custom SVG semicircular gauge. No charting library required.

- Arc from 180° to 0° (left to right).
- Fill color: `#48BB78` (green) if passed, `#FC8181` (red) if failed.
- A 70% marker line at the corresponding arc position.
- Score text centered below arc.

### 14.4 Domain Bar

```typescript
// DomainBar.tsx
interface DomainBarProps {
  displayName: string;
  weight: number;
  percentage: number;
  passed: boolean; // percentage >= 70
}
```

- Bar background: `bg-slate-700`.
- Bar fill: `bg-green-500` if `percentage >= 70`, else `bg-red-500`.
- 70% threshold marker: a vertical white line at 70% of bar width.

---

## 15. CI Validation Script (`scripts/validate-questions.ts`)

```typescript
import questionsRaw from '../data/questions.json';
import { QuestionBankSchema } from '../lib/questionSchema';
import { validateBank } from '../lib/validateBank';

function main() {
  console.log('Validating question bank...\n');

  const result = QuestionBankSchema.safeParse(questionsRaw);
  if (!result.success) {
    console.error('Schema validation failed:');
    result.error.issues.forEach(issue => {
      console.error(`  [${issue.path.join('.')}] ${issue.message}`);
    });
    process.exit(1);
  }

  try {
    validateBank(result.data);
  } catch (err) {
    console.error(String(err));
    process.exit(1);
  }

  console.log(`✓ ${result.data.length} questions valid`);
  const counts: Record<string, number> = {};
  result.data.forEach(q => { counts[q.domain] = (counts[q.domain] ?? 0) + 1; });
  console.table(counts);
  process.exit(0);
}

main();
```

**`package.json` script:**
```json
{
  "scripts": {
    "validate:questions": "tsx scripts/validate-questions.ts",
    "dev": "next dev",
    "build": "npm run validate:questions && next build",
    "typecheck": "tsc --noEmit"
  }
}
```

`validate:questions` runs as a pre-step to `next build`. A CI/CD pipeline (GitHub Actions / Vercel build) will fail if the bank is malformed or any domain is short.

---

## 16. Color Palette & Theming

All Tailwind custom tokens defined in `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      brand: {
        red:    '#FF3621', // Databricks primary
        dark:   '#1C2526', // page background
        surface:'#2D3748', // card/panel background
        border: '#4A5568', // subtle borders
      },
      status: {
        pass:   '#48BB78',
        fail:   '#FC8181',
        warn:   '#ECC94B',
        flag:   '#F6AD55',
      }
    }
  }
}
```

Dark mode is enforced globally (no light mode toggle). `class="dark"` on `<html>`.

---

## 17. localStorage Key Map

| Key | Type | Contents | Max Size |
|---|---|---|---|
| `examSession` | `ExamSession \| null` | Managed by Zustand `persist` | ~5 KB |
| `examHistory` | `HistoryEntry[]` | Last 20 results (summary only) | ~3 KB |

No other localStorage keys. `lastResult` is in Zustand memory only (not persisted).

---

## 18. Edge Cases & Invariants

| Scenario | Behavior |
|---|---|
| User navigates to `/exam` with no active session | Redirect to `/` |
| User navigates to `/results` with no `lastResult` | Redirect to `/` |
| Timer expires while on results page (impossible but guarded) | No-op (timer only runs on `/exam`) |
| All 45 questions answered, no submit clicked, timer reaches 0 | Auto-submit with `expired=true` |
| 0 questions answered, timer expires | Auto-submit; all unanswered = incorrect; likely FAIL |
| Question bank domain pool exactly equals required count | Valid; no randomization within pool (all selected) |
| `questions.json` has duplicate IDs | `validateBank` throws at module load; build fails |
| User opens two tabs simultaneously | Both share same `examSession` in localStorage; last write wins for answers. Acceptable trade-off — no multi-tab sync needed. |
| Next.js App Router hydration mismatch (timer) | `useTimer` is client-only; `startTimestamp` is read from Zustand store after hydration, not from server |

---

## 19. Dependencies Summary

```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "react-dom": "^18",
    "zustand": "^4",
    "shiki": "^1",
    "zod": "^3",
    "sonner": "^1",
    "@radix-ui/react-accordion": "^1",
    "@radix-ui/react-dialog": "^1",
    "@radix-ui/react-progress": "^1",
    "tailwindcss": "^3",
    "class-variance-authority": "^0.7",
    "clsx": "^2",
    "tailwind-merge": "^2"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/react": "^18",
    "@types/node": "^20",
    "tsx": "^4"
  }
}
```

shadcn/ui components used (installed individually via `npx shadcn-ui@latest add`):
- `button`, `card`, `badge`, `progress`, `dialog`, `accordion`, `separator`, `toast`

---

## 20. Implementation Order

When this spec is handed to a code generation context, implement in this order to avoid circular dependencies:

1. `lib/types.ts` — all interfaces
2. `lib/domainConfig.ts` — `DOMAIN_CONFIG` constant
3. `lib/questionSchema.ts` — Zod schema
4. `lib/validateBank.ts` — pure function, no imports from app
5. `lib/timer.ts` — pure functions
6. `lib/scoring.ts` — depends on types + domainConfig
7. `data/questions.json` — seed with ≥ 45 questions (min per-domain counts met)
8. `scripts/validate-questions.ts` — validates bank
9. `lib/sampler.ts` — depends on validateBank + domainConfig
10. `store/examStore.ts` — depends on sampler + scoring + types
11. `components/CodeBlock.tsx` — Shiki RSC component
12. `components/QuestionCard.tsx` — client component
13. `components/QuestionPalette.tsx` — desktop + mobile variants
14. `components/TimerDisplay.tsx` + `useTimer` hook
15. `components/DomainBar.tsx` + `ScoreGauge.tsx` + `ReviewAccordion.tsx`
16. `app/exam/page.tsx` — assembles exam session
17. `app/results/page.tsx` — assembles results view
18. `app/page.tsx` — landing page with resume dialog + history

---

*End of specification. Do not begin code generation until this document is reviewed and the context window is cleared.*
