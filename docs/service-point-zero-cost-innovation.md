# FINORA Service Point — Local Intelligence (September 2026)

## Scope and routes

The operational page `/ar/service-point` (or `/en/service-point`) now includes the profit and liquidity center, operation search, quick templates, risk check, cash denomination counter, and shift handover. `/ar/service-point/owner-dashboard` (or `/en/...`) includes daily targets, operational scorecard, break-even calculator, profit calendar, scenario simulator, hourly activity, and next-day estimate. The existing Owner Command Center remains in place.

These features use local operations for the selected company and store. No backend, external database, cloud sync, Fawry API, payment gateway, external AI, or remote cross-device owner dashboard has been added.

## Financial formulas

- Service profit = customer fee − provider cost. Store expenses reduce operating profit. Transaction amount is volume, not revenue.
- Fee leakage estimate = configured normal fee − actual fee, only where actual fee is lower. Provider cost excess = actual cost − configured normal cost, only where higher. These are estimates against locally configured rules, not recovered money.
- Cash shortages use actual closing cash − expected closing cash per closed shift. Signals are for review; they are not fraud findings.
- Liquidity outgoing requirement sums negative balance movements per service or cash across the last 14 days and divides by observed operating days. At least two days are required. Runway = current balance ÷ average daily outgoing requirement. It is an estimate, not a guarantee.
- Provider cards show current balance, configured minimum, recent flow, fees, costs, profit, pending and failed counts, and runway.
- Fee matrix groups successful, non-reversed service transactions by provider and type. Fee margin = total profit ÷ customer fees. A category is only assigned after at least three transactions.
- Cash denomination count = sum of denomination × nonnegative whole-number quantity. Variance = counted cash − expected cash.
- Break-even operations = ceiling(monthly fixed expenses ÷ average service profit). No number is shown if average service profit is zero or negative.
- Daily targets count successful, non-reversed service operations. Profit includes successful store expenses. Pending and failed operations do not affect live balances or profit.
- Scenario simulator changes fees, provider costs, volume, expenses, and optional shift cost in memory only. It never creates an operation or journal entry. The forecast requires three distinct operating dates and uses observed daily averages.

## Workflow and local storage

Rules, targets, quick templates, handovers, and reviewed alert markers use `finora-service-point-innovation:<company>:store:<store>` with `schemaVersion: 1`. Missing or malformed values use safe defaults. The backup format is now version 2 and includes this store-scoped data. Version 1 backups still restore; they start with default innovation settings. Sales Demo reset removes only innovation data of registered demo stores.

At closing, the system stores a handover package with expected and counted cash, provider differences, pending/failed/reversed counts, expenses, notes, and both cashier names. The next cashier must review and accept the previous handover before opening a new shift. The browser print command can print the handover view. This is a local operational record, not an immutable security audit.

The operation risk check previews after-operation cash and provider balances. Negative balances remain blocked by the existing posting validation; low balances, missing or reused references, and low or negative margins are review warnings. Quick templates fill existing operation fields and use the existing posting validation. Operation search stays within the selected store and displays 50 results at a time.

## Deliberately deferred

Owner/manager cash movements need dedicated accounting entries and reconciliation treatment. Monthly expense budgets, incident log, configurable opening/closing checklists, consolidated printable owner pack, dedicated shift timeline, and full morning/evening dashboard modes are not included in this increment. No page advertises these as live features.

## Data and operational limits

All records remain in the current browser's `localStorage`. Clearing site data may erase them. Backup/Restore is manual. There is no automatic backup or synchronization. Alerts are generated deterministically from current local data; marking one reviewed is a local UI marker and does not erase the underlying operation. PWA availability still depends on assets previously cached by the browser.
