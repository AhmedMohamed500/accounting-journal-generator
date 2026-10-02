# Hawally | حوّلي

Hawally is the public brand of this bilingual, frontend-first accounting operations, business-management, and service-point product. Selected `finora-*` technical identifiers remain unchanged to preserve local data and backup compatibility. Educational training has been extracted into the independent [Debit & Credit](https://github.com/AhmedMohamed500/Debit-Credit) product by Money Coder.

## Operational scope

- Company workspaces, roles, and local isolation.
- Journal creation, review, approval, posting, reversal, and a local editable-device audit trail.
- Chart of accounts, ledger, trial balance, statements, and reports.
- Customers, suppliers, customer receivables, receivable aging, and cash-flow planning. A dedicated supplier-payables subledger and payable aging workflow are not implemented.
- Document cycle, invoice capture, banking, reconciliation, custody, VAT, and period close.
- Accounting-office, service-point/POS, spreadsheet analysis, and decision simulation.
- Arabic/English localization, RTL/LTR layout, PWA support, and local persistence.
- Service Point operations: shifts, seven provider balances, transaction lifecycle, owner/manager money movements, expense budgets, incidents, configurable shift checklists, provider statements, reconciliation, exception review, and a daily owner pack.

Hawally no longer contains Academy, Arena, Missions, Money Flow, Accounting Detective, learner profiles, or educational progress storage. Those modules, their real content, and their tests live in Debit & Credit.

## Full project documentation

The complete Arabic handoff, operating guide, architecture reference, deployment status, and module map are available in [`HAWALLY_PROJECT_FULL_GUIDE_AR.md`](./HAWALLY_PROJECT_FULL_GUIDE_AR.md). Files using the legacy FINORA name remain for compatibility and project history.

## Stack

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- Vitest and Testing Library
- LocalStorage-based local-first architecture

## Public product experience

The localized public routes `/ar` and `/en` present the complete Hawally product around three connected layers: Service Point Operations, Accounting Operations, and Owner Control. The landing experience uses verified demo data and the real Hawally visual system, links directly to the interactive Service Point demo, and describes local-first/PWA capabilities without claiming cloud sync, external AI, or official provider API integrations.

## Architecture and current limits

Hawally is currently frontend-first and local-first. Data persists in the current browser, with company, branch, fiscal-year, and store scopes where applicable. The repository does not provide a production backend, central database, cross-device synchronization, server-side authentication, cloud backup, official Fawry or wallet integrations, a payment gateway, or an external AI service.

Backup and restore are available as local JSON workflows. Local roles and PINs support single-device demonstrations and controlled local use, but they are not a substitute for production server authorization.

### Service Point accounting rules

- Providers: Fawry, Vodafone Cash, Orange Cash, e& Cash, Aman, Masary, and InstaPay. Each has an independent asset balance.
- Statuses: successful, pending, failed, and reversed. Pending and failed records do not affect live balances or journals. Reversal keeps the original and creates an opposite movement and journal.
- Profit: customer fees minus provider costs minus store expenses. Transaction principal is never revenue.
- Owner capital and withdrawals are financing/equity movements. Documented manager adjustments post to cash over/short. These movements update the selected balance but never inflate sales, fees, volume, or transaction count.
- All Service Point operational data stays in the current browser and is included in version 3 JSON backups.

## Development

```bash
npm install
npm run dev
```

## Quality gates

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Or run all checks with `npm run check`.
