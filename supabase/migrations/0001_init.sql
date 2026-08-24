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

-- Upgrade an existing runs table created before updated_at was introduced.
alter table runs
  add column if not exists updated_at timestamptz not null default now();

-- Align the earlier result_json name with the column used by the application.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'runs' and column_name = 'result_json'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'runs' and column_name = 'result'
  ) then
    alter table runs rename column result_json to result;
  end if;
end;
$$;

-- Upgrade older runs tables that only contained the initial status fields.
alter table runs
  add column if not exists error_message text,
  add column if not exists result jsonb,
  add column if not exists pdf_url text,
  add column if not exists created_at timestamptz not null default now();

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

-- Row Level Security: all runs are read and written through server-side
-- code using the service-role key. No browser role receives table access.
alter table runs enable row level security;

drop policy if exists "anon can read runs" on runs;
revoke all on table runs from anon;

-- Ask PostgREST to refresh its column metadata after an existing table is upgraded.
notify pgrst, 'reload schema';

-- Storage bucket for generated report PDFs. Private so reports cannot be
-- listed or downloaded through a public storage policy.
insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;

drop policy if exists "public can read report pdfs" on storage.objects;
