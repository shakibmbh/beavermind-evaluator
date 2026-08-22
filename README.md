# BeaverMind Call Evaluator

AI-powered call quality evaluation for Halden Method kick-off and coaching calls.

## What You Need (All Free Tier)

1. **Supabase** — Database
2. **Vercel** — Hosting
3. **Inngest** — Background jobs
4. **Google AI Studio** — LLM (Gemini 2.0 Flash)

## Setup Steps

### 1. Supabase
- Create project at https://supabase.com
- Go to SQL Editor → New query → paste:

```sql
create table runs (
  id uuid primary key default gen_random_uuid(),
  call_type text not null check (call_type in ('kickoff','coaching')),
  transcript text not null,
  status text not null default 'queued' check (status in ('queued','running','done','failed')),
  error_message text,
  result_json jsonb,
  pdf_url text,
  caps_applied jsonb,
  created_at timestamptz default now(),
  completed_at timestamptz
);

alter table runs enable row level security;
create policy "Allow all" on runs for all using (true) with check (true);
```

- Get Project URL and Anon Key from Project Settings → API

### 2. Google AI Studio
- Go to https://aistudio.google.com/app/apikey
- Create API key

### 3. Inngest
- Sign up at https://inngest.com
- Get your **Signing Key** from dashboard

### 4. Environment Variables
Copy `.env.local.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `INNGEST_SIGNING_KEY`

### 5. Deploy to Vercel
```bash
npm install
npm run build
# Push to GitHub, then import to Vercel
```

### 6. Connect Inngest
After Vercel deploy:
- In Inngest dashboard, add your Vercel production URL
- Or use the Inngest Vercel integration

## Architecture

- **LLM interprets evidence** (Gemini extracts quotes and scores)
- **Code enforces rules** (caps, buckets, D4 disabled, normalization)
- **Inngest handles background** (close tab, it keeps running)
- **Supabase persists** (shareable URLs, permanent storage)
- **PDF mirrors web report** (same JSON data, client-side render)

## Key Design Decisions

1. **One LLM call + deterministic rule engine** — Multi-step is cleaner in theory but adds failure points. One structured call with code validation is faster and auditable.
2. **Gemini 2.0 Flash** — Only major provider with a genuinely free tier (15 RPM, 1,500/day), 1M context window, native JSON mode. Handles 65KB transcripts without chunking.
3. **Inngest for background** — Vercel Hobby has 10s timeout. Inngest gives "close the tab, it keeps running" with retries.
4. **Client-side PDF** — `@react-pdf/renderer` generates from the same JSON result. No server load, no Puppeteer complexity.
5. **Evidence-first prompt** — Forces the model to cite verbatim quotes before scoring. Makes hallucination obvious and auditable.
