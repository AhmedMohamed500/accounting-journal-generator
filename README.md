# FINORA — Accounting Operations Platform

## Installable Service Point demo

FINORA Service Point now includes an installable local-first PWA and a deterministic seven-step sales demo at `/ar/service-point/demo` and `/en/service-point/demo`. It exercises the real shift, transaction, recommendation, and close engines while keeping demo data isolated. See [the PWA and interactive demo guide](docs/service-point-pwa-sales-demo.md).

> Last updated: 3 September 2026

## FINORA Arena

FINORA Arena is FINORA's primary game-based accounting learning experience: a dense professional workspace rather than a lesson catalog or marketing page. Its approved desktop composition matches the `4444.png` reference: one FINORA status bar, a left rail for career, company challenges, and weekly leaders; a dominant center for the active mission, six-step workflow, real account cards, journal builder, and immediate impact; a right rail for the CFO message, hiring readiness, verified skills, and demo companies; and one season progress bar at the bottom. The general site header and footer are omitted on the Arena workspace so no extra navigation or content surrounds the approved composition. Mobile moves the mission and accounting interaction first.

Routes:

- `/:locale/arena` — complete accounting gameplay workspace with mission, real accounts, journal, live impact, career, and competition
- `/:locale/arena/career` — the same active workspace entry for existing career links
- `/:locale/arena/profile` — score, rank, skill matrix, confidence, and privacy
- `/:locale/arena/leaderboard` — fair demo ranking with local profile
- `/:locale/arena/daily` — deterministic daily challenge and streak
- `/:locale/arena/missions`, `/money-flow`, `/detective` — safe bridges to the existing game modes
- `/:locale/academy/account-guide` — preserved official Account Nature reference

The Academy landing route redirects safely to Arena. Every deep Academy lesson remains available and is documented in [the migration audit](docs/academy-to-arena-migration.md). Account Nature is the explicit exception: its existing content and teaching model remain the official reference library, with two-way navigation that preserves Arena state.

Career play covers the journey from why accounts exist, Chart of Accounts, Account Nature, increase/decrease and debit/credit discovery, Journal Builder and balance validation, posting, General Ledger, Trial Balance, customers, suppliers, cash, banking, VAT, adjustments, financial statements, closing, and the full accounting cycle. Existing FINORA Missions become Quick Missions, Money Flow Lab becomes the visual learning mode, and Accounting Detective becomes the investigation and error-recovery mode.

Professional evaluation is configurable in `lib/arena/engine.ts`:

- Accuracy 45%, difficulty 20%, consistency 15%, error detection 10%, efficiency 10%.
- Score range: 0–1000. Ranking uses best attempt per unique case, difficulty weighting, and ranked attempts only.
- Skill ratings cover 20 dimensions at 0–100 with Low, Medium, High, and Verified confidence.
- Verification requires at least five unique attempts/cases, 85% best accuracy, and non-beginner difficulty evidence.
- Replays may be practice-only; 500 repeats of one easy case cannot outrank diverse hard-case performance.
- Career stages use configured evidence requirements, not XP alone.

Season 1, Service Company world architecture, Work Shifts, professional Boss Challenges, Company Health, CFO Trust, Daily Challenge, achievement/performance-review models, profile visibility, and future talent-network fields are included as a local-first foundation. The leaderboard uses real sorting logic with demo competitors; live multi-user seasons and employer discovery require a future backend.

Arena reads account definitions from FINORA's existing `data/accounts.ts`, filters them through the shared postability rules, and validates training entries with the existing journal validator. It persists only to `finora-training-arena-v2` and never calls operational journal, company, customer, supplier, bank, VAT, report, or close storage adapters. New learners begin with blank journal fields and zero progress; invoice facts and task guidance are shown without pre-filling the answer. RTL Arabic, LTR English, tap/select alternatives, and layouts for 320px through desktop are included. See [the Arena game-system guide](docs/arena-game-system.md).

Release verification: TypeScript, ESLint, and all **376 tests across 60 test files** pass; production-build verification is part of every release.

آخر تحديث: 2 سبتمبر 2026 — FINORA Money Flow Lab. الحالة الحالية: مكتمل محليًا، ومغطى بالاختبارات، ومتصل بـFINORA Learn وMissions.

Arabic-first, bilingual journal-entry generator built with Next.js, TypeScript, Tailwind CSS, React Hook Form, Zod, Vitest, and a local accounting rules engine. No database, login, AI key, or paid API is required.

## Features

- Arabic RTL and English LTR routes with responsive light/dark UI
- Natural-language parser for common Arabic and English accounting phrases
- Guided, validated transaction form
- Double-entry generation with balance checks, explanations, assumptions, warnings, statement impact, and cash-flow category
- VAT included/excluded, commercial discounts, withholding tax, and straight-line depreciation
- Searchable central transaction registry and SEO-friendly detail pages
- Recent entries and favorites stored only in browser `localStorage`
- Editable local chart of accounts, general journal, and automatically calculated trial balance
- Daily accountant workspace with priorities, deadlines, recurrence, workflow states, filters, metrics, and entry linking
- Dedicated accounting-firm command center for client files, monthly documents, tasks, Kanban, entry review, employee workload, practice, and printable office reports
- Expanded account-nature reference covering more than 180 core, sector-specific, tax, contract, manufacturing, investment, and contra accounts
- Local multi-company and team-role model prepared for future authentication and secure tenant isolation
- Smart month-end close center with readiness scoring, time estimation, automated risk detection, workflow signals, and a per-company period checklist
- Accounting document inbox with SHA-256 duplicate detection, review workflow, and links to entries and tasks
- Local Arabic/English invoice OCR and PDF text extraction with editable structured fields, total validation, and draft entry proposals
- Smart CSV bank reconciliation with amount/date/reference matching, confidence scores, manual links, and draft entries for unmatched activity
- Company-scoped customer receivables center with credit limits, tax-aware credit invoices, partial collections, running statements, aging buckets, and journal-linked draft entries
- FINORA Missions: five mobile-first consequence-based accounting cases with hints, scoring, impact simulation, balanced training entries, and isolated local progress
- FINORA Accounting Detective: five evidence-led investigations with case files, progressive hints, conclusions, notebooks, evidence links, scoring, skills, and isolated training treatments
- FINORA Money Flow Lab: seven visual value-movement scenarios with accessible drag/tap controls, before/after balances, derived debit/credit logic, consequences, variations, reverse mode, and isolated skill progress
- Fiscal years and monthly periods with soft close, final locking, and enforced entry-save/post protection
- General ledger, income statement, and balance sheet with date filters, print, and CSV export
- Company defaults, numbering configuration, and versioned per-company JSON backup and restore
- Unified multi-line document cycle for sales, purchases, receipts, payments, and returns with approval-triggered draft entries
- Local XLSX/CSV analyzer with multi-sheet profiling, numeric ratios, categorical distributions, date ranges, previews, and data-quality warnings
- Copy, print, CSV, JSON, and client-side PDF export
- Sitemap, robots, metadata, custom 404, policies, and disclaimer
- Pure-function unit test suite

## Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. On Windows systems that block PowerShell scripts, use `npm.cmd run dev`.

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run check
```

## Structure

- `app/`: App Router pages, localized layouts, sitemap, and robots
- `components/`: layout, generator, journal result, library, and history UI
- `data/`: central transaction, currency, accounting-office mock data, and account-learning registries
- `components/accounting-office/`: the navigable frontend prototype for accounting firms
- `data/missions.ts`, `lib/missions/`, and `components/missions/`: reusable interactive mission data, scoring/impact engine, and student experience
- `data/money-flow/`, `lib/money-flow/`, and `components/money-flow/`: visual money-movement scenarios, accounting derivation engine, reusable account/token components, and training UI
- `data/detective/`, `lib/detective/`, `lib/storage/detective.ts`, and `components/detective/`: case definitions, evidence/conclusion engine, isolated progress, and the responsive investigator workspace
- `lib/accounting/`: currency-safe calculations and balance validation
- `lib/parser/`: number normalization and deterministic text parsing
- `rules/`: typed journal-entry rules engine
- `types/`: shared accounting/parser contracts
- `tests/`: Vitest tests for accounting and parsing

## Extending the engine

Add a transaction definition in `data/transactions.ts`, then add its calculation branch (or a dedicated strategy) in `rules/index.ts`. UI cards, search, localized detail pages, and generator options consume the same registry. Keep calculation code out of React components and add balanced-entry tests for both ordinary and tax cases.

To add a language, introduce a locale route, translated registry fields/copy, locale-aware formatting, and direction in the localized layout. Change currencies in `data/currencies.ts`. The default VAT is supplied by the form and rules input; country defaults are in the same data module.

Future AI support can sit behind a server-only adapter that returns the existing `ParseResult` contract. Never expose `AI_API_KEY` to client code; deterministic rules should remain the final accounting calculator.

## FINORA Accounting Detective

Accounting Detective teaches investigation rather than recall. A learner opens a company case, reviews only the panels needed for that case, marks or excludes evidence, links related items, keeps a notebook, and confirms a conclusion. A wrong conclusion returns focused feedback and a progressive hint without exposing the solution.

Accounting Detective is part of the Academy practical-training area. Canonical routes are `/ar/academy/detective`, `/en/academy/detective`, and `/{locale}/academy/detective/{case-slug}`. Legacy `/{locale}/detective` links redirect to the Academy routes without changing the isolated progress data.

Each case lives in `data/detective/cases.ts` and implements `DetectiveCase`: identity and bilingual copy, difficulty and duration, skills and panels, typed evidence, exact relevant-evidence IDs, logical conclusion choices, three hints, balanced training treatments, financial impact, explanation, review checks, note presets, related Mission, and score rules. Evidence supports bank transactions, journal entries, invoices, receipts, party messages, cash movements, balances, documents, Excel rows, internal notes, and asset-register records. Components never contain case content.

The Evidence Engine also supports ledger movements, important/excluded states, evidence links, quick/custom notes, and a chronological timeline built only from evidence the learner has opened. The Hint System exposes three progressive levels and each used level reduces the final score.

The conclusion engine requires both the exact relevant evidence set and the correct conclusion. The score has a 1,000-point ceiling: 400 for the correct conclusion, 300 for relevant evidence, 150 for using no hints, 100 for efficient investigation, and a light 50-point time bonus. Constants and penalties for wrong evidence, hints, and extra attempts are defined in `DETECTIVE_SCORE_RULES`.

Case progress, notes, opened/important/excluded evidence, evidence links, best scores, results, and skill progress are stored only under `finora-training-detective-v1`. Training entries are plain sandbox projections marked `sandbox: true`; the Detective code has no adapter to real journals, customers, banks, reports, or workspaces.

To add a case, append a `DetectiveCase` object to `detectiveCases`, use unique case/evidence/conclusion IDs, include exactly three progressive hints, make every `correctEvidence` ID refer to an existing evidence item, set a valid `correctConclusion`, and keep every accounting treatment balanced. `validateDetectiveCase` and the Detective test suite verify these invariants.

Link a case to FINORA Missions with `relatedMissionSlug`; this only creates a result-page practice CTA and does not make either learning engine depend on the other. Detective is a public learning experience like Missions and never requires creating or opening a real company workspace. The complete suite currently contains 53 test files and 269 passing tests.

The accounting-office prototype intentionally uses `data/accounting-office.ts` only. Replace that module with backend adapters later while preserving the page and component contracts. Real authentication, tenant isolation, file storage, notifications, and audit logging remain future backend work.

## Storage and privacy

Recent entries and favorite transaction slugs are stored in `localStorage`. Clearing site data removes them. Transaction descriptions are not sent to a server by this application.

## Deployment

Import the repository into Vercel, set `NEXT_PUBLIC_APP_URL` to the production origin, and deploy with the standard Next.js preset. No other environment variable is required.

## Known limitations

The initial registry focuses on representative core flows and is designed for expansion; it does not encode every jurisdiction-specific treatment or every specialized transaction in the larger product backlog. PDF output uses English account labels for maximum built-in font compatibility; browser print preserves Arabic. Natural-language parsing is deterministic and intentionally asks for confirmation when uncertain.

## Disclaimer

Generated entries are educational and assistive. Actual accounting and tax treatment varies by country, activity, chart of accounts, policy, contracts, and law. A qualified accountant should review entries before official posting or tax filing.
