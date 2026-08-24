-- Run in the Supabase SQL editor after applying all migrations.
-- Expected result: the anon query is rejected because anon has no table
-- privileges or RLS SELECT policy. No application data is printed.
set role anon;
select 1 from public.runs limit 1;
reset role;

-- Expected result: zero rows. Reports are private and use signed URLs.
select policyname
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname = 'public can read report pdfs';