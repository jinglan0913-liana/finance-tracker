-- ============================================================
--  Finance Tracker — database setup
--  Run this ONCE in Supabase → SQL Editor → New query → Run.
--  Safe to re-run: it drops and recreates the tables.
-- ============================================================

-- Wipe any previous attempt. Order matters: transactions point at accounts.
drop table if exists transactions;
drop table if exists budgets;
drop table if exists accounts;


-- ------------------------------------------------------------
--  ACCOUNTS — one row per account you own
-- ------------------------------------------------------------
create table accounts (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  type        text        not null,   -- Checking | Savings | Cash | Wallet | Credit Card | Investment
  currency    text        not null,   -- USD | CNY
  balance     numeric(14, 2) not null default 0,

  -- The app already displays these two on the account cards,
  -- so they are stored rather than thrown away.
  institution text        not null default '',
  last4       text        not null default '',

  created_at  timestamptz not null default now()
);


-- ------------------------------------------------------------
--  TRANSACTIONS
--
--  How the account columns are used:
--    expense / income  -> account_id            (from/to stay null)
--    transfer          -> from_account_id + to_account_id  (account_id stays null)
--
--  `amount` is ALWAYS positive. `type` says which way the money went,
--  which is what keeps transfers out of income and expense totals.
-- ------------------------------------------------------------
create table transactions (
  id              uuid primary key default gen_random_uuid(),
  name            text        not null,      -- what the app calls "description"
  date            date        not null,
  type            text        not null,      -- expense | income | transfer
  category        text        not null,      -- Groceries, Dining, ... | Income | Transfer
  amount          numeric(14, 2) not null check (amount > 0),
  currency        text        not null,

  account_id      uuid references accounts(id) on delete set null,
  from_account_id uuid references accounts(id) on delete set null,
  to_account_id   uuid references accounts(id) on delete set null,

  created_at      timestamptz not null default now(),

  -- Enforce the rule above in the database, not just in the app.
  constraint transaction_accounts_match_type check (
    (type in ('expense', 'income')
       and account_id is not null
       and from_account_id is null
       and to_account_id is null)
    or
    (type = 'transfer'
       and account_id is null
       and from_account_id is not null
       and to_account_id is not null
       and from_account_id <> to_account_id)
  )
);

create index transactions_date_idx on transactions (date desc);


-- ------------------------------------------------------------
--  BUDGETS — one row per category PER MONTH.
--  The `month` column is what keeps August and September separate.
-- ------------------------------------------------------------
create table budgets (
  id            uuid primary key default gen_random_uuid(),
  month         text        not null,          -- "2026-08"
  category      text        not null,          -- Groceries, Dining, ...
  monthly_limit numeric(14, 2) not null check (monthly_limit > 0),
  created_at    timestamptz not null default now(),

  -- One budget per category per month — no accidental duplicates.
  unique (month, category)
);


-- ============================================================
--  ROW LEVEL SECURITY
--
--  READ THIS. The app has no login yet, so it talks to Supabase
--  using the PUBLIC anon key, which is visible to anyone who opens
--  your site and looks at the network tab.
--
--  The policies below allow that anon key to read and write these
--  three tables. In other words: ANYONE WHO HAS YOUR PROJECT URL
--  AND ANON KEY CAN READ AND CHANGE YOUR FINANCE DATA.
--
--  That is an acceptable trade for a private, unshared, local-only
--  personal app with placeholder numbers. It is NOT acceptable once
--  you deploy it publicly or put real balances in it. The fix is
--  Supabase Auth plus policies scoped to `auth.uid()`.
-- ============================================================
alter table accounts     enable row level security;
alter table transactions enable row level security;
alter table budgets      enable row level security;

create policy "anon full access" on accounts
  for all to anon using (true) with check (true);
create policy "anon full access" on transactions
  for all to anon using (true) with check (true);
create policy "anon full access" on budgets
  for all to anon using (true) with check (true);
