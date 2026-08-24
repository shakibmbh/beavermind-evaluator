-- The run page reads through server-side code, so the browser does not need
-- direct table access. With RLS enabled and no anon SELECT policy, a guessed
-- or broad anon query returns no rows.
alter table public.runs enable row level security;
drop policy if exists "anon can read runs" on public.runs;
revoke all on table public.runs from anon;

-- Reports contain the evaluation output and must not be listable as a public
-- bucket. The application stores a signed URL for the generated PDF instead.
update storage.buckets
set public = false
where id = 'reports';

drop policy if exists "public can read report pdfs" on storage.objects;

-- Realtime is no longer needed; status polling uses an ID-scoped server route.
do $$
begin
  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'runs'
  ) then
    alter publication supabase_realtime drop table runs;
  end if;
end;
$$;