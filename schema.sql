-- ============================================================
-- Expense Tracker — Supabase schema
-- Run this in Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================

-- 1. PROFILES
-- Mirrors auth.users so we have a friendly display name + a stable
-- FK target that isn't the auth schema. One row is auto-created per
-- signup via the trigger below.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. CATEGORIES
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_default boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

insert into public.categories (name, is_default) values
  ('Food', true),
  ('Travel', true),
  ('Groceries', true),
  ('Gym', true),
  ('Rent', true),
  ('Cook/Maid Salary', true);

-- 3. EXPENSES
create type expense_type as enum ('personal', 'common');
create type payment_method as enum ('card', 'cash', 'upi', 'bank_transfer');

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  amount numeric(12,2) not null check (amount > 0),
  expense_date date not null default current_date,
  category_id uuid not null references public.categories(id),
  expense_type expense_type not null,
  -- owner_id: whose personal expense this is. Must be null for 'common'
  -- and set for 'personal'. Enforced by the check constraint below.
  owner_id uuid references public.profiles(id),
  payment_method payment_method not null,
  description text,
  added_by uuid not null references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_matches_type check (
    (expense_type = 'common' and owner_id is null) or
    (expense_type = 'personal' and owner_id is not null)
  )
);

create index expenses_date_idx on public.expenses (expense_date desc);
create index expenses_type_idx on public.expenses (expense_type);
create index expenses_category_idx on public.expenses (category_id);

-- keep updated_at fresh
create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- Both partners can see everything (it's a shared household budget)
-- and both can edit/delete any row, not just their own — since you'll
-- often need to fix a typo in a spend your spouse logged.
-- Tighten the update/delete policies later if you'd rather each person
-- only edit their own entries.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;

-- Profiles: any logged-in user (i.e. either partner) can read both profiles
create policy "profiles readable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Categories: readable by all authenticated users, insertable by all
-- (this is how "create new category" works), no delete of defaults
create policy "categories readable by authenticated users"
  on public.categories for select
  using (auth.role() = 'authenticated');

create policy "authenticated users can add categories"
  on public.categories for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated users can delete non-default categories"
  on public.categories for delete
  using (auth.role() = 'authenticated' and is_default = false);

-- Expenses: full shared read/write access between the two authenticated users
create policy "expenses readable by authenticated users"
  on public.expenses for select
  using (auth.role() = 'authenticated');

create policy "authenticated users can add expenses"
  on public.expenses for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated users can update expenses"
  on public.expenses for update
  using (auth.role() = 'authenticated');

create policy "authenticated users can delete expenses"
  on public.expenses for delete
  using (auth.role() = 'authenticated');

-- ============================================================
-- NOTE ON SIGNUP
-- Since this is a private 2-person app, disable public signups in
-- Supabase Auth settings once both accounts are created (Authentication
-- > Settings > "Allow new users to sign up" → off), or just invite the
-- two of you directly from the Supabase dashboard.
-- ============================================================
