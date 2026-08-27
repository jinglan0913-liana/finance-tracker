-- ============================================================
--  Finance Tracker — atomic edit & delete for transactions
--
--  Run this in Supabase → SQL Editor → New query → Run.
--
--  SAFE TO RE-RUN. It only creates functions (`create or replace`),
--  so running it twice just rewrites them.
--
--  It does NOT drop any table, does NOT change any policy, and does
--  NOT touch your data. (Do not re-run schema.sql — that one wipes
--  everything.)
--
--  ------------------------------------------------------------
--  WHY THIS FILE EXISTS
--  ------------------------------------------------------------
--  Editing or deleting a transaction changes MORE THAN ONE ROW:
--
--    delete an expense   -> remove the row  + give the money back
--    edit a transfer     -> rewrite the row + move four balances
--                           (old from, old to, new from, new to)
--
--  Done from the browser that is several separate requests, and any
--  one of them can be the one that fails — leaving a transaction that
--  no longer matches the balances around it.
--
--  A Postgres function runs inside ONE transaction. Either every row
--  changes or none of them do. That is the whole point of this file.
--
--  ------------------------------------------------------------
--  SECURITY — nothing here weakens what add-auth.sql set up
--  ------------------------------------------------------------
--  Every function below is SECURITY INVOKER (the default). It runs as
--  whoever called it, so row level security still applies inside it
--  exactly as it does to a normal query: you can only read, change or
--  delete your own rows. No service-role key is involved anywhere, and
--  each statement also spells out `user_id = auth.uid()` so the rule is
--  visible in the code as well as enforced beneath it.
-- ============================================================


-- ------------------------------------------------------------
--  1. The one place that knows how a transaction moves money
--
--  p_direction is +1 to APPLY the transaction and -1 to REVERSE it.
--  Reversing is not a special case — it is the same arithmetic with
--  the sign flipped, which is why the two can never drift apart.
--
--    expense  -> money leaves  account_id
--    income   -> money arrives in account_id
--    transfer -> money leaves  from_account_id
--                and arrives in to_account_id
--
--  `balance = balance ± x` is read and written in a single statement,
--  so two changes landing at once cannot lose one of them.
--
--  A null account means the account was deleted (the foreign keys are
--  `on delete set null`). There is nothing to adjust, so it is skipped
--  rather than treated as an error.
-- ------------------------------------------------------------
create or replace function public.finance_apply_effect(
  p_type            text,
  p_amount          numeric,
  p_account_id      uuid,
  p_from_account_id uuid,
  p_to_account_id   uuid,
  p_direction       int
) returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_type = 'expense' then
    update accounts
       set balance = balance - (p_amount * p_direction)
     where id = p_account_id
       and user_id = auth.uid();

  elsif p_type = 'income' then
    update accounts
       set balance = balance + (p_amount * p_direction)
     where id = p_account_id
       and user_id = auth.uid();

  elsif p_type = 'transfer' then
    update accounts
       set balance = balance - (p_amount * p_direction)
     where id = p_from_account_id
       and user_id = auth.uid();

    update accounts
       set balance = balance + (p_amount * p_direction)
     where id = p_to_account_id
       and user_id = auth.uid();

  else
    raise exception 'Unknown transaction type: %', p_type;
  end if;
end;
$$;


-- ------------------------------------------------------------
--  2. Delete a transaction and give its money back
--
--  Reverses the transaction's effect first, then removes the row.
--
--    delete a $100 expense on BOA   -> BOA + $100
--    delete a $1,000 income         -> that account - $1,000
--    delete a $500 Checking→Savings -> Checking + $500, Savings - $500
--
--  Returns the accounts it touched, with their new balances, so the
--  app can show the real stored numbers rather than its own guess.
-- ------------------------------------------------------------
create or replace function public.delete_transaction(p_id uuid)
returns setof accounts
language plpgsql
security invoker
set search_path = public
as $$
declare
  t transactions%rowtype;
begin
  -- `for update` holds this row until the function finishes, so the
  -- same transaction cannot be deleted twice from two tabs.
  select * into t
    from transactions
   where id = p_id
     and user_id = auth.uid()
   for update;

  if not found then
    raise exception 'That transaction no longer exists, or it is not yours.';
  end if;

  perform finance_apply_effect(
    t.type, t.amount, t.account_id, t.from_account_id, t.to_account_id, -1
  );

  delete from transactions where id = p_id;

  return query
    select * from accounts
     where user_id = auth.uid()
       and id in (t.account_id, t.from_account_id, t.to_account_id);
end;
$$;


-- ------------------------------------------------------------
--  3. Edit a transaction: reverse the old one, then apply the new one
--
--  This is the rule the whole feature turns on. An edit is never an
--  overwrite — the balances the OLD transaction moved are put back
--  before the NEW transaction is allowed to move anything.
--
--    $100 expense on Chase  ->  $80 expense on BOA
--      Chase + $100   (old one reversed)
--      BOA   -  $80   (new one applied)
--
--  Because the old row is read here rather than sent up from the
--  browser, the reversal is always based on what is actually stored.
--  Changing the type works for free: reversing a $500 income and
--  applying a $100 expense is just the two steps above with different
--  arguments.
--
--  The `transaction_accounts_match_type` check from schema.sql still
--  runs on the update, so a transfer without both accounts, or an
--  expense that smuggles in a to_account_id, is rejected here — and
--  because that happens inside the same database transaction, the
--  reversal in step one is undone with it. Nothing is left half-done.
-- ------------------------------------------------------------
create or replace function public.update_transaction(
  p_id              uuid,
  p_name            text,
  p_date            date,
  p_type            text,
  p_category        text,
  p_amount          numeric,
  p_currency        text,
  p_account_id      uuid,
  p_from_account_id uuid,
  p_to_account_id   uuid
) returns setof accounts
language plpgsql
security invoker
set search_path = public
as $$
declare
  t transactions%rowtype;
begin
  select * into t
    from transactions
   where id = p_id
     and user_id = auth.uid()
   for update;

  if not found then
    raise exception 'That transaction no longer exists, or it is not yours.';
  end if;

  -- 1. Undo what the old transaction did.
  perform finance_apply_effect(
    t.type, t.amount, t.account_id, t.from_account_id, t.to_account_id, -1
  );

  -- 2. Replace the record itself.
  update transactions
     set name            = p_name,
         date            = p_date,
         type            = p_type,
         category        = p_category,
         amount          = p_amount,
         currency        = p_currency,
         account_id      = p_account_id,
         from_account_id = p_from_account_id,
         to_account_id   = p_to_account_id
   where id = p_id
     and user_id = auth.uid();

  -- 3. Apply what the new transaction does.
  perform finance_apply_effect(
    p_type, p_amount, p_account_id, p_from_account_id, p_to_account_id, 1
  );

  -- Every account either side of the edit may have moved.
  return query
    select * from accounts
     where user_id = auth.uid()
       and id in (
         t.account_id, t.from_account_id, t.to_account_id,
         p_account_id, p_from_account_id, p_to_account_id
       );
end;
$$;


-- ------------------------------------------------------------
--  4. Who is allowed to call these
--
--  Signed-in users only. Being able to call a function is not the same
--  as being able to change data with it — row level security still
--  decides that, row by row — but there is no reason for a signed-out
--  visitor to reach them at all.
-- ------------------------------------------------------------
revoke all on function public.finance_apply_effect(text, numeric, uuid, uuid, uuid, int) from public;
revoke all on function public.delete_transaction(uuid) from public;
revoke all on function public.update_transaction(uuid, text, date, text, text, numeric, text, uuid, uuid, uuid) from public;

grant execute on function public.finance_apply_effect(text, numeric, uuid, uuid, uuid, int) to authenticated;
grant execute on function public.delete_transaction(uuid) to authenticated;
grant execute on function public.update_transaction(uuid, text, date, text, text, numeric, text, uuid, uuid, uuid) to authenticated;


-- ------------------------------------------------------------
--  5. Tell the API layer the functions exist
--
--  Supabase usually notices new functions on its own. This line asks it
--  to look again straight away, so you never have to wait — and it is
--  what to re-run if the app ever says a function "could not be found
--  in the schema cache".
-- ------------------------------------------------------------
notify pgrst, 'reload schema';


-- ------------------------------------------------------------
--  6. Check it worked
--
--  Should list the three functions above.
-- ------------------------------------------------------------
select routine_name, security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'finance_apply_effect', 'delete_transaction', 'update_transaction'
  )
order by routine_name;
