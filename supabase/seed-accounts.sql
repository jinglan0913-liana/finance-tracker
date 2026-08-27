-- ============================================================
--  OPTIONAL — your six accounts.
--
--  Run this only if you want to start with the accounts the app
--  was using before. The BALANCES BELOW ARE PLACEHOLDERS — edit
--  them to your real numbers first, or set them all to 0 and
--  correct them later from the Accounts page.
--
--  Transactions are deliberately NOT seeded. You start empty.
-- ============================================================

insert into accounts (name, type, currency, balance, institution, last4) values
  ('Chase Checking', 'Checking', 'USD',  4820.55, 'Chase',            '4412'),
  ('Chase Savings',  'Savings',  'USD', 12400.00, 'Chase',            '8890'),
  ('BOA Checking',   'Checking', 'USD',  2315.18, 'Bank of America',  '1023'),
  ('Cash',           'Cash',     'USD',   240.00, 'Wallet',           ''),
  ('WeChat Wallet',  'Wallet',   'CNY',  3260.40, 'WeChat Pay',       ''),
  ('工商银行卡',      'Checking', 'CNY', 18500.00, 'ICBC',             '7734');
