-- ============================================================
--  Finance Tracker — add login and per-user security
--
--  Run this in Supabase → SQL Editor → New query → Run.
--
--  SAFE TO RE-RUN. Every step checks the current state first, so
--  running it twice does nothing the second time instead of failing.
--
--  It does NOT drop any table and does NOT delete your data.
--  (Do not re-run schema.sql — that one wipes everything.)
-- ============================================================


-- ------------------------------------------------------------
--  1. Add an owner to every row
--
--  `references auth.users(id)` ties each row to a real login.
--  `on delete cascade` means deleting the login deletes its data.
--  `default auth.uid()` fills the column in automatically with
--  whoever is logged in, so it can never be forgotten.
--
--  `if not exists` is what makes this safe to run again.
-- ------------------------------------------------------------
alter table accounts
  add column if not exists user_id uuid
  references auth.users(id) on delete cascade
  default auth.uid();

alter table transactions
  add column if not exists user_id uuid
  references auth.users(id) on delete cascade
  default auth.uid();

alter table budgets
  add column if not exists user_id uuid
  references auth.users(id) on delete cascade
  default auth.uid();

-- Every query now filters by owner, so give that column an index.
create index if not exists accounts_user_id_idx     on accounts (user_id);
create index if not exists transactions_user_id_idx on transactions (user_id);
create index if not exists budgets_user_id_idx      on budgets (user_id);


-- ------------------------------------------------------------
--  2. Budgets are unique per USER per month per category
--
--  The old rule said one Groceries budget per month, full stop.
--  With logins that is wrong: two people must each be able to have
--  their own August Groceries budget.
--
--  Dropping first (if present) is what lets this run twice.
-- ------------------------------------------------------------
alter table budgets drop constraint if exists budgets_month_category_key;
alter table budgets drop constraint if exists budgets_user_month_category_key;
alter table budgets
  add constraint budgets_user_month_category_key
  unique (user_id, month, category);


-- ------------------------------------------------------------
--  3. Remove the old wide-open policies
--
--  These let anyone holding the public anon key read and write
--  everything. That is what we are replacing.
-- ------------------------------------------------------------
drop policy if exists "anon full access" on accounts;
drop policy if exists "anon full access" on transactions;
drop policy if exists "anon full access" on budgets;

-- Row level security stays on. (Also safe to run repeatedly.)
alter table accounts     enable row level security;
alter table transactions enable row level security;
alter table budgets      enable row level security;


-- ------------------------------------------------------------
--  4. New rule: you can only touch your own rows
--
--  `using`      controls which existing rows you can see or change.
--  `with check` controls what you are allowed to write.
--
--  Both compare auth.uid() — the id of the logged-in user, taken
--  from their token — against the row's user_id. There is no way to
--  read someone else's data, and no way to write a row owned by
--  someone else, because the database refuses at the row level.
--  `to authenticated` means signed-out visitors get nothing at all.
--
--  Postgres has no "create policy if not exists", so each one is
--  dropped immediately before it is created. That is what fixes the
--  "policy already exists" error on a second run.
-- ------------------------------------------------------------

-- ---- accounts ----
drop policy if exists "read own accounts" on accounts;
create policy "read own accounts" on accounts
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "insert own accounts" on accounts;
create policy "insert own accounts" on accounts
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "update own accounts" on accounts;
create policy "update own accounts" on accounts
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete own accounts" on accounts;
create policy "delete own accounts" on accounts
  for delete to authenticated
  using (auth.uid() = user_id);

-- ---- transactions ----
drop policy if exists "read own transactions" on transactions;
create policy "read own transactions" on transactions
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "insert own transactions" on transactions;
create policy "insert own transactions" on transactions
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "update own transactions" on transactions;
create policy "update own transactions" on transactions
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete own transactions" on transactions;
create policy "delete own transactions" on transactions
  for delete to authenticated
  using (auth.uid() = user_id);

-- ---- budgets ----
drop policy if exists "read own budgets" on budgets;
create policy "read own budgets" on budgets
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "insert own budgets" on budgets;
create policy "insert own budgets" on budgets
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "update own budgets" on budgets;
create policy "update own budgets" on budgets
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete own budgets" on budgets;
create policy "delete own budgets" on budgets
  for delete to authenticated
  using (auth.uid() = user_id);


-- ------------------------------------------------------------
--  5. Check it worked
--
--  Should list 12 rows: four policies on each of the three tables,
--  and no "anon full access" among them.
-- ------------------------------------------------------------
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('accounts', 'transactions', 'budgets')
order by tablename, cmd, policyname;


-- ============================================================
--  OPTIONAL — rows created before logins existed
--
--  Anything added while the app had no login has user_id = null.
--  Nobody owns those rows, so nobody can see them any more: the
--  policies above compare against a user id, and null never matches.
--
--  They are harmless, just invisible. To clear them out, uncomment
--  and run these three lines. To claim them for yourself instead,
--  sign up first, then in the Table Editor set their user_id to
--  your id from Authentication → Users.
-- ============================================================
-- delete from transactions where user_id is null;
-- delete from budgets      where user_id is null;
-- delete from accounts     where user_id is null;
