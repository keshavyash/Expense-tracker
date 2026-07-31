# Offline Expense Tracker

A simple offline expense tracker that stores data locally in your browser (localStorage). Designed for two people with a pooled "common" budget and three expense types:
- personal (you)
- personal (spouse)
- common (shared)

Categories include: Food, Travel, Groceries, Gym, Rent, Cook/Maid Salary — you can add new categories.

Payment methods: Card, Cash, UPI, Bank Transfer.

## Files
- index.html  — UI (already added)
- styles.css  — Styling (already added)
- app.js      — Application logic (added now)

## How to run
1. Put `index.html`, `styles.css`, and `app.js` in the same folder (repo root is fine).
2. Open `index.html` in a modern browser (Chrome, Firefox, Edge).
3. Data is saved automatically to localStorage.

## Features
- Add/edit/delete expenses
- Filter by expense type (you / spouse / common)
- Pooled common budget — shows remaining after common expenses
- Export/Import JSON backup
- Create custom categories
- Payment method selection

## Storage and backup
- Local storage keys:
  - expenses_v1 — list of expense objects
  - categories_v1 — list of categories
  - common_budget_v1 — pooled amount
- Use the "Export JSON" button to create a backup file; import it later to restore.

## Next steps / enhancements
- Optional encryption for local backups
- Add multi-device sync (e.g., optional encrypted cloud sync)
- Add charts and date-range filters
- Add per-category budgets and alerts

## Notes
This is intentionally lightweight and works fully offline. If you want further changes (e.g., charts, per-category budgets, or a mobile-friendly UI), tell me what you want and I can iterate.
