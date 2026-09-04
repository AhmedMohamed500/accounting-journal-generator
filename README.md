# FINORA

FINORA is a bilingual, frontend-first accounting operations and business-management product. Educational training has been extracted into the independent [Debit & Credit](https://github.com/AhmedMohamed500/Debit-Credit) product by Money Coder.

## Operational scope

- Company workspaces, roles, and local isolation.
- Journal creation, review, approval, posting, reversal, and audit history.
- Chart of accounts, ledger, trial balance, statements, and reports.
- Customers, suppliers, receivables, payables, aging, and cash-flow planning.
- Document cycle, invoice capture, banking, reconciliation, custody, VAT, and period close.
- Accounting-office, service-point/POS, spreadsheet analysis, and decision simulation.
- Arabic/English localization, RTL/LTR layout, PWA support, and local persistence.

FINORA no longer contains Academy, Arena, Missions, Money Flow, Accounting Detective, learner profiles, or educational progress storage. Those modules, their real content, and their tests live in Debit & Credit.

## Stack

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- Vitest and Testing Library
- LocalStorage-based local-first architecture

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
