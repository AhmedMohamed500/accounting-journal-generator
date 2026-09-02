# FINORA Arena — Professional Accounting Career Simulation

Last updated: 3 September 2026

## Product vision

Arena is a workplace simulation, not a lesson catalog. The player receives a document, understands the economic event, selects accounts from FINORA's actual chart, builds the journal entry, reviews the financial impact, and approves the task. Explanations appear in context and the Account Nature section remains the official reference library.

## Core game loop

1. Review the source document.
2. Analyze what the company received, gave up, owns, or owes.
3. Select active postable accounts from FINORA's chart.
4. Build debit and credit lines.
5. Validate with FINORA's existing journal validator.
6. Review account, profit, and cash impact.
7. Approve the training task and update isolated career evidence.

The primary workflow is visible at all times: Document → Analysis → Accounts → Journal → Impact → Approval. Tap cards and native selects provide equivalent mouse, touch, and keyboard paths.

## Accounting source of truth

`data/accounts.ts` is the account source. `lib/arena/account-adapter.ts` creates cloned, training-only cards from active postable leaf accounts. It adds plain-language bilingual descriptions but does not redefine account codes, names, types, normal balances, or posting availability.

Arena journal drafts are passed to `lib/accounting/validation.ts`. The adapter does not import `lib/storage/accounting.ts`, and approval only writes the Arena profile key `finora-training-arena-v1`. Training activity therefore cannot create, edit, post, or close operational company records.

## Current mission

The first complete mission is supplier invoice `INV-2048` from Al Noor Industries:

- Inventory `1200`: debit EGP 25,000.
- Input VAT `1151`: debit EGP 3,500.
- Accounts payable `2100`: credit EGP 28,500.

The journal can balance while still being conceptually wrong, so Arena checks exact account selection, side, amount, and core journal validity. A wrong answer displays the business consequence rather than only saying “incorrect.”

## Evaluation

Task assessment records accounting accuracy, account selection, debit/credit accuracy, amount accuracy, error detection, hints, efficiency, recovery, difficulty, and a weighted total. The broader professional score remains configured in `lib/arena/engine.ts`: accuracy 45%, difficulty 20%, consistency 15%, error detection 10%, and efficiency 10%.

Hiring Readiness is a 0–100 evidence indicator based on skill coverage, accuracy, verified skills, unique cases, closing exposure, banking, and journal performance. It is not an employment guarantee. Demo competitors and demo companies are explicitly labeled and do not imply real employer interest.

## Approved gameplay UI

Arena uses a bright, information-rich finance workspace with restrained blue, green, amber, and red signals. Its approved composition is the supplied `4444.png` reference, without any additional site header, footer, hero, or surrounding presentation content.

Desktop has one top bar with the FINORA identity and six status metrics. Below it are three compact columns: the left rail contains career progression, company challenges, and weekly leaders; the dominant center contains the horizontal current mission, six-step workflow, icon-led real account cards, journal builder, and immediate impact; the right rail contains the CFO message, hiring readiness, verified skills, and explicitly labeled demo companies. A season and experience bar closes the workspace at the bottom.

On mobile the order is mission, workflow, account selection, journal builder, immediate impact, CFO feedback, performance, career progress, and leaderboard. Controls remain touch and keyboard accessible without horizontal page overflow. Arabic is RTL and English is LTR.

## Extending Arena

- Add a task to `data/arena-tasks.ts` with a unique ID, document, expected real account codes, skills, difficulty, and reward.
- Add skills and ranks in `types/arena.ts`, `lib/arena/profile.ts`, and the configured ranks in `lib/arena/engine.ts`.
- Add a work shift or boss challenge in `data/arena.ts`; keep task content in data rather than React components.
- Add tests for balance, postability, exact answer, financial impact, and isolation.
- Never import operational storage into `lib/arena/` or an Arena component.

Live competitors, real employer discovery, a company portal, authentication, tenant isolation, notifications, and shared seasons require a future backend. The current version uses no paid API, database, or subscription service.
