# Ledger — Household Expense Tracker

A shared expense tracker for two people, built with Next.js (App Router) and
Supabase. Deploys to Vercel.

## Features
- Three views on every spend: **Common**, **Personal (You)**, **Personal (Spouse)**
- Categories: Food, Travel, Groceries, Gym, Rent, Cook/Maid Salary — plus your own custom ones
- Payment methods: Card, Cash, UPI, Bank transfer
- Dashboard with monthly totals, full filterable expense list, category management, and reports (spend by category, personal/common split, 6-month trend)
- Responsive: sidebar nav on desktop, bottom tab bar + floating add button on mobile
- Supabase Auth — both partners sign in, either can log/edit any expense, and every entry is attributed to whoever added it

## Setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste the contents of `schema.sql` (in this repo,
   or from the plan doc you already have) → run it
3. Go to **Project Settings → API** and copy the **Project URL** and
   **anon public key**
4. Once both of you have signed up in the app, go to **Authentication →
   Settings** and turn off "Allow new users to sign up" so no one else can
   create an account

### 2. Local development
```bash
npm install
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```
Open http://localhost:3000 — you'll land on `/login`. Use "Create account"
to make the first account, then again for the second person.

### 3. Deploy to Vercel
1. Push this repo to GitHub (already done: keshavyash/Expense-tracker)
2. Import the repo in [Vercel](https://vercel.com/new)
3. Add the two env vars from `.env.local.example` in the Vercel project's
   **Settings → Environment Variables**
4. Deploy

## Project structure
```
src/
  app/
    login/                 sign in / sign up
    (app)/                 protected routes (behind middleware)
      page.tsx              dashboard
      expenses/             list, new, edit
      categories/           manage categories
      reports/              charts
  components/               ExpenseForm, ExpenseRow, BucketCard, Charts, Nav, FilterBar
  lib/
    supabase/                client/server/middleware helpers
    data.ts                  server-side reads
    actions.ts                server actions (mutations)
    database.types.ts         shared TS types
    format.ts                 currency/date formatting (INR)
```

## Notes
- Both partners can view and edit all expenses (including each other's
  personal ones) — this was a deliberate choice for a shared household
  ledger. Tighten the RLS policies in `schema.sql` if you'd rather each
  person only edit their own entries.
- Currency is formatted as INR (₹). Change `src/lib/format.ts` if you want
  a different currency.
