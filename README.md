# FINORA — Accounting Operations Platform

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
- Customer and supplier subledgers with credit terms, open invoices, partial payments, aging buckets, and collection/payment draft entries
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
- `lib/accounting/`: currency-safe calculations and balance validation
- `lib/parser/`: number normalization and deterministic text parsing
- `rules/`: typed journal-entry rules engine
- `types/`: shared accounting/parser contracts
- `tests/`: Vitest tests for accounting and parsing

## Extending the engine

Add a transaction definition in `data/transactions.ts`, then add its calculation branch (or a dedicated strategy) in `rules/index.ts`. UI cards, search, localized detail pages, and generator options consume the same registry. Keep calculation code out of React components and add balanced-entry tests for both ordinary and tax cases.

To add a language, introduce a locale route, translated registry fields/copy, locale-aware formatting, and direction in the localized layout. Change currencies in `data/currencies.ts`. The default VAT is supplied by the form and rules input; country defaults are in the same data module.

Future AI support can sit behind a server-only adapter that returns the existing `ParseResult` contract. Never expose `AI_API_KEY` to client code; deterministic rules should remain the final accounting calculator.

The accounting-office prototype intentionally uses `data/accounting-office.ts` only. Replace that module with backend adapters later while preserving the page and component contracts. Real authentication, tenant isolation, file storage, notifications, and audit logging remain future backend work.

## Storage and privacy

Recent entries and favorite transaction slugs are stored in `localStorage`. Clearing site data removes them. Transaction descriptions are not sent to a server by this application.

## Deployment

Import the repository into Vercel, set `NEXT_PUBLIC_APP_URL` to the production origin, and deploy with the standard Next.js preset. No other environment variable is required.

## Known limitations

The initial registry focuses on representative core flows and is designed for expansion; it does not encode every jurisdiction-specific treatment or every specialized transaction in the larger product backlog. PDF output uses English account labels for maximum built-in font compatibility; browser print preserves Arabic. Natural-language parsing is deterministic and intentionally asks for confirmation when uncertain.

## Disclaimer

Generated entries are educational and assistive. Actual accounting and tax treatment varies by country, activity, chart of accounts, policy, contracts, and law. A qualified accountant should review entries before official posting or tax filing.
