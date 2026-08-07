-- ============================================================
-- Expense Tracker — Supabase schema
-- Run this in Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================

-- 1. PROFILES
-- Mirrors auth.users so we have a friendly display name + a stable
-- FK target that isn't the auth schema. One row is auto-created per
-- signup via the trigger below. This represents WHO CAN LOG IN.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

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

-- 2. HOUSEHOLD MEMBERS
-- Represents WHO AN EXPENSE BELONGS TO — deliberately separate from
-- login/profiles, so a spend can be attributed to your spouse (or
-- anyone else in the household) without them ever needing an account.
-- The app links a member to a real login automatically (via
-- linked_user_id) the first time that person signs in, if an
-- unclaimed member row is sitting around waiting for them.
create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  linked_user_id uuid unique references auth.users(id),
  -- exactly one member can be flagged as the Sodexo owner — Sodexo
  -- expenses always fund from their account regardless of who's
  -- filling out the expense form (enforced in the app, not the DB)
  owns_sodexo boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.household_members enable row level security;

create policy "household_members readable by authenticated users"
  on public.household_members for select
  using (auth.role() = 'authenticated');

create policy "authenticated users can add household_members"
  on public.household_members for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated users can rename household_members"
  on public.household_members for update
  using (auth.role() = 'authenticated');

-- 3. CATEGORIES
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

-- 4. VENDORS — people/places you pay (auto-added as you type them on
-- the expense form; also manageable from the Categories page)
create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- case-insensitive uniqueness so "Swiggy" and "swiggy" don't become two vendors
create unique index vendors_name_lower_idx on public.vendors (lower(name));

alter table public.vendors enable row level security;

create policy "vendors readable by authenticated users"
  on public.vendors for select
  using (auth.role() = 'authenticated');

create policy "authenticated users can add vendors"
  on public.vendors for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated users can rename vendors"
  on public.vendors for update
  using (auth.role() = 'authenticated');

create policy "authenticated users can delete vendors"
  on public.vendors for delete
  using (auth.role() = 'authenticated');

-- 5. GROUPS — bucket several expenses together (e.g. a 5-day trip),
-- viewable with a running total, addable by either of you.
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.profiles(id),
  -- does this group ever involve third parties who aren't household
  -- members (e.g. friends on a trip)? Controls whether "Others" shows
  -- up as a splittable/payer option for expenses in this group.
  others_involved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.groups enable row level security;

create policy "groups readable by authenticated users"
  on public.groups for select
  using (auth.role() = 'authenticated');

create policy "authenticated users can add groups"
  on public.groups for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated users can rename groups"
  on public.groups for update
  using (auth.role() = 'authenticated');

create policy "authenticated users can delete groups"
  on public.groups for delete
  using (auth.role() = 'authenticated');

-- 6. EXPENSES
create type expense_type as enum ('personal', 'common');
create type payment_method as enum ('card', 'cash', 'upi', 'bank_transfer', 'sodexo');

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  amount numeric(12,2) not null check (amount > 0),
  expense_date date not null default current_date,
  category_id uuid not null references public.categories(id),
  expense_type expense_type not null,
  -- owner_id: whose personal expense this is (a household_member, not a
  -- login). Must be null for 'common' and set for 'personal'.
  owner_id uuid references public.household_members(id),
  vendor_id uuid references public.vendors(id),
  group_id uuid references public.groups(id),
  payment_method payment_method not null,
  -- funded_by: whose account/card actually paid — a household_member,
  -- independent of expense_type. NULL means the shared/common account
  -- (e.g. a common expense can still be fronted on your personal card).
  funded_by uuid references public.household_members(id),
  -- whether an outside party paid — mutually exclusive with funded_by
  -- having a value (enforced in the app, not the DB)
  paid_by_others boolean not null default false,
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
create index expenses_vendor_idx on public.expenses (vendor_id);
create index expenses_funded_by_idx on public.expenses (funded_by);
create index expenses_group_idx on public.expenses (group_id);

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

-- 7. EXPENSE SPLITS — one row per party sharing an expense.
-- party_type = 'others' represents the whole untracked third-party
-- group (e.g. friends on a trip) as a single lump share.
create table public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  party_type text not null check (party_type in ('member', 'others')),
  member_id uuid references public.household_members(id),
  share_amount numeric(12,2) not null check (share_amount >= 0),
  constraint member_id_matches_party_type check (
    (party_type = 'member' and member_id is not null) or
    (party_type = 'others' and member_id is null)
  )
);

create index expense_splits_expense_idx on public.expense_splits (expense_id);

alter table public.expense_splits enable row level security;

create policy "expense_splits readable by authenticated users"
  on public.expense_splits for select
  using (auth.role() = 'authenticated');

create policy "authenticated users can add expense_splits"
  on public.expense_splits for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated users can update expense_splits"
  on public.expense_splits for update
  using (auth.role() = 'authenticated');

create policy "authenticated users can delete expense_splits"
  on public.expense_splits for delete
  using (auth.role() = 'authenticated');

-- ============================================================
-- ROW LEVEL SECURITY (expenses, categories, profiles)
-- Both partners can see everything (it's a shared household budget)
-- and both can edit/delete any row, not just their own.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;

create policy "profiles readable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "categories readable by authenticated users"
  on public.categories for select
  using (auth.role() = 'authenticated');

create policy "authenticated users can add categories"
  on public.categories for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated users can delete non-default categories"
  on public.categories for delete
  using (auth.role() = 'authenticated' and is_default = false);

create policy "authenticated users can rename categories"
  on public.categories for update
  using (auth.role() = 'authenticated');

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
-- Since this is a private household app, disable public signups in
-- Supabase Auth settings once the people who need logins have them
-- (Authentication > Settings > "Allow new users to sign up" → off).
-- People WITHOUT logins can still have expenses tracked for them via
-- household_members — add a placeholder row for them from the app's
-- Categories & household page.
-- ============================================================
