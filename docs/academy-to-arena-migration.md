# FINORA Academy → FINORA Arena Migration Audit

Last updated: 2 September 2026

This audit was completed before retiring the Academy landing experience. No lesson or training unit was deleted. `/ar/academy` and `/en/academy` redirect to Arena; deep Academy routes remain valid so bookmarks do not produce 404s. The Account Nature guide remains the official reference library and preserves its existing teaching philosophy and UI.

Status vocabulary: **Keep** = unchanged; **Transform** = core idea becomes gameplay; **Reference** = linked supporting material; **Deprecated** = old presentation remains reachable but is no longer the primary path.

| Old Content | Old Route | Current Function | New Game Mode | New Route | Migration Status | Decision | Notes |
|---|---|---|---|---|---|---|---|
| Academy home | `/:locale/academy` | Course catalog | Career hub | `/:locale/arena` | Migrated | Deprecated | Safe redirect; no deletion. |
| Accounting equation | `/academy/accounting-foundations/accounting-equation` | Equation lesson | First funding / company health | `/arena/career` | Mapped | Transform | Situation precedes terminology. |
| Account nature lesson | `/academy/accounting-foundations/account-nature` | Short lesson | Contextual reference link | `/academy/account-guide` | Mapped | Reference | Not duplicated inside gameplay. |
| Debit and credit | `/academy/accounting-foundations/debit-credit` | Rules and quiz | Pattern discovery | `/arena/career` + `/money-flow` | Mapped | Transform | Movement first, labels second. |
| Chart of accounts | `/academy/accounting-foundations/chart-of-accounts` | Tree concepts | Chart Builder | `/arena/career` | Implemented | Transform | Tap-to-category mobile mechanic. |
| Cash/credit purchases | `/academy/journal-entry-masterclass/cash-credit-purchases` | Purchase entries | Supplier shift | `/arena/career` | Mapped | Transform | Reuses journal validation concepts. |
| Cash/credit sales | `/academy/journal-entry-masterclass/cash-credit-sales` | Sale entries | Customer shift | `/arena/career` | Mapped | Transform | Sale and collection separated. |
| Expenses/accruals | `/academy/journal-entry-masterclass/expenses-accruals` | Accrual basis | Adjustment event | `/arena/career` | Mapped | Transform | Economic event before payment question. |
| Capital/loans/drawings | `/academy/journal-entry-masterclass/capital-loans-drawings` | Financing entries | First funding flow | `/money-flow` | Reused | Transform | Existing Money Flow scenario reused. |
| Fixed assets/depreciation | `/academy/journal-entry-masterclass/fixed-assets-depreciation` | Asset treatment | Asset-or-expense mission | `/missions/asset-or-expense` | Reused | Transform | Existing mission retained. |
| Adjusting entries | `/academy/journal-entry-masterclass/adjusting-entries` | Period adjustments | Month-end shift | `/arena/career` | Mapped | Transform | Feeds closing readiness. |
| Supplier cycle | `/academy/customers-suppliers/supplier-cycle` | AP lifecycle | Supplier work shift | `/arena/career` | Mapped | Transform | Invoice, partial payment, statement. |
| Customer cycle | `/academy/customers-suppliers/customer-cycle` | AR lifecycle | Customer work shift | `/arena/career` | Mapped | Transform | Existing receivables engines remain references. |
| Discounts/returns | `/academy/customers-suppliers/discounts-returns` | Adjustments to trade | Story event | `/arena/career` | Mapped | Transform | Planned as shift event in current world. |
| Aging/credit control | `/academy/customers-suppliers/aging-credit-control` | Receivable risk | CFO decision | `/arena/career` | Mapped | Transform | Company receivables health target. |
| Cash control | `/academy/treasury-banking/cash-control` | Cash controls | Treasury shift | `/arena/career` | Mapped | Transform | Internal transfer explicitly not expense. |
| Bank accounts | `/academy/treasury-banking/bank-accounts` | Banking operations | Treasury shift | `/arena/career` | Mapped | Transform | Links to visual Money Flow. |
| Incoming checks | `/academy/treasury-banking/incoming-checks` | Check lifecycle | Story event | `/arena/career` | Mapped | Transform | Deep lesson kept until full event ships. |
| Outgoing checks | `/academy/treasury-banking/outgoing-checks` | Check lifecycle | Story event | `/arena/career` | Mapped | Transform | Deep lesson kept until full event ships. |
| Bank reconciliation | `/academy/treasury-banking/bank-reconciliation` | Reconciliation | Detective case / boss | `/detective/missing-7500` | Reused | Transform | Existing D001 and mission 005 reused. |
| Journal and ledger | `/academy/reports-close/journal-ledger` | Posting explanation | Visual posting stage | `/arena/career` | Mapped | Transform | Sandbox posting only. |
| Trial balance | `/academy/reports-close/trial-balance` | Balance construction | First Trial Balance boss | `/arena/career` | Mapped | Transform | Find-the-difference follows imbalance. |
| Income statement | `/academy/reports-close/income-statement` | Statement lesson | Owner profit question | `/arena/career` | Mapped | Transform | Student selects revenue/expenses first. |
| Balance sheet | `/academy/reports-close/balance-sheet` | Position statement | Company position reveal | `/arena/career` | Mapped | Transform | Label appears after account selection. |
| Closing process | `/academy/reports-close/closing-process` | Close checklist | Month-End Boss | `/arena/career` | Mapped | Transform | Professional challenge, not cartoon boss. |
| Document control | `/academy/professional-accountant/document-control` | Source document controls | Full-cycle task | `/arena/career` | Mapped | Transform | Document → journal → approval → posting. |
| Error detection | `/academy/professional-accountant/error-detection` | Review skills | Accounting Detective / recovery | `/detective` | Reused | Transform | Five existing cases retained. |
| Excel for accountants | `/academy/professional-accountant/excel-for-accountants` | Spreadsheet analysis | Weekly Mystery foundation | `/arena/career` | Mapped | Transform | Existing spreadsheet analyzer is not modified. |
| Management decisions | `/academy/professional-accountant/management-decisions` | Decision support | CFO events / company health | `/arena/career` | Mapped | Transform | Consequences update professional indicators. |
| Practice Lab | `/academy/practice` | Traditional mixed quiz | Practice replay | `/arena/career` | Preserved | Deprecated | Practice can remain unranked; no rank farming. |
| FINORA Missions | `/missions` | Five short cases | Quick Missions | `/arena/missions` → `/missions` | Reused | Keep | Existing engine and training storage reused. |
| Daily Mission | `/missions/daily` | Date-selected mission | Daily Challenge | `/arena/daily` | Extended | Transform | Deterministic date and streak. |
| Accounting Detective | `/detective` and `/academy/detective` | Five investigations | Detective Mode | `/arena/detective` → `/detective` | Reused | Keep | Training journal remains sandbox-only. |
| Money Flow Lab | `/money-flow` | Seven visual scenarios | Visual Learning Mode | `/arena/money-flow` → `/money-flow` | Reused | Keep | Career stages link to the existing lab. |
| Account Nature Guide | `/academy/account-guide` | Full account reference | Official Reference Library | `/academy/account-guide` | Preserved | **Keep / Reference** | Current methodology and content preserved; Return to Game added. |

## Content inventory and reuse

- 6 Academy courses, 28 lessons, 28 knowledge checks, and all embedded examples remain in `data/academy.ts`.
- 5 Quick Missions in `data/missions.ts`, 5 Detective cases in `data/detective/cases.ts`, and 7 Money Flow scenarios in `data/money-flow/scenarios.ts` are reused rather than duplicated.
- Journal, posting, ledger, trial balance, statements, receivables, banking, VAT, periods, closing, document, invoice, spreadsheet, and storage engines were reviewed. Arena logic lives separately under `lib/arena/`.
- No real-company adapter is imported by Arena. Its only persistence key is `finora-training-arena-v1`.

## Account Nature exception

`/:locale/academy/account-guide` is the official reference library. Arena provides **Review account nature / راجع طبيعة الحساب** and the reference provides **Return to game / العودة إلى اللعبة**. Arena progress is stored separately, so returning does not lose the game state. The existing guide is not replaced, deleted, or converted into a game.

## Future migration work

Some deeper story events (checks, discounts, aging, Excel mystery, complete interactive month close) are structurally mapped and retain their source lessons until their richer event UI ships. This is deliberate preservation, not silent removal. Live multi-user ranking, employer visibility, contact sharing, and a company portal require authentication and a backend and are explicitly outside the current local-only implementation.
