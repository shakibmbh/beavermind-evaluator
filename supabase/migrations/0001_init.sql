-- Run this in the Supabase SQL editor (or via `supabase db push` if using the CLI).

create extension if not exists "pgcrypto";

create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  call_type text not null check (call_type in ('kickoff', 'coaching')),
  transcript text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed')),
  error_message text,
  result jsonb,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at current on every write.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists runs_set_updated_at on runs;
create trigger runs_set_updated_at
  before update on runs
  for each row
  execute function set_updated_at();

-- Row Level Security: the browser (anon key) may only ever read a run by
-- its id. All writes go through the server (service-role key) in the API
-- route and the Inngest function, so no INSERT/UPDATE policy is granted
-- to anon at all.
alter table runs enable row level security;

drop policy if exists "anon can read runs" on runs;
create policy "anon can read runs"
  on runs for select
  to anon
  using (true);

-- Enable realtime so the /run/[id] page can subscribe to status changes
-- instead of polling. (Safe to run twice; Supabase ignores duplicates.)
alter publication supabase_realtime add table runs;

-- Storage bucket for generated report PDFs. Public so the "Download PDF"
-- link works directly -- run ids are unguessable UUIDs, so this is
-- equivalent in practice to an unlisted share link, same as the /run/[id]
-- page itself.
insert into storage.buckets (id, name, public)
values ('reports', 'reports', true)
on conflict (id) do nothing;

drop policy if exists "public can read report pdfs" on storage.objects;
create policy "public can read report pdfs"
  on storage.objects for select
  to public
  using (bucket_id = 'reports');
