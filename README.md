# Call Evaluator

Paste a kick-off or coaching call transcript, get it scored against the
client's rubric with a durable, shareable report and a downloadable PDF.

## Stack

- **Next.js 15** (App Router) on **Vercel** -- UI + API routes
- **Supabase** (Postgres + Storage + Realtime) -- the `runs` table, the PDF
  bucket, and live status updates on the run page
- **Inngest** -- durable background execution. Each run is processed as a
  checkpointed step function, decoupled from the HTTP request that created
  it, with automatic per-step retries
- **Gemini 2.5 Flash** (free tier) -- structured JSON scoring, 1M token
  context (comfortably handles the largest transcript at ~65K characters)
- **@react-pdf/renderer** -- server-side PDF generation, no headless browser

Every piece above is free at this scale. No paid subscription is required
anywhere in this stack.

## Architecture, in one paragraph

The browser never talks to the LLM directly. Submitting a transcript
inserts a row into Supabase and fires an Inngest event, then returns
immediately with a run id -- this is what lets someone close the tab and
come back later. Inngest calls back into `/api/inngest` one step at a time
(call Gemini -> verify quotes against the transcript -> apply the rubric's
automatic caps deterministically -> render and upload the PDF -> mark the
run done), retrying any individual step that fails rather than the whole
pipeline. The run page subscribes to the row via Supabase Realtime (with a
polling fallback) so it always reflects the true current state: queued,
running, done, or failed with a reason.

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) (free tier).
2. Open the SQL editor and run `supabase/migrations/0001_init.sql`. This
   creates the `runs` table, RLS policies, the Realtime publication, and
   the `reports` storage bucket in one shot.
3. From **Project Settings -> API**, grab your project URL, `anon` key, and
   `service_role` key.

### 2. Gemini API key

Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
No billing account required for the free tier.

### 3. Local environment

```bash
npm install
cp .env.example .env.local
# fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL,
# NEXT_PUBLIC_SUPABASE_ANON_KEY, GEMINI_API_KEY
```

### 4. Inngest, locally

```bash
npm run dev            # terminal 1
npx inngest-cli dev    # terminal 2 -- opens a dashboard at localhost:8288
```

Submit a transcript at `localhost:3000` and watch the run process step by
step in the Inngest dev dashboard before deploying anywhere.

### 5. Deploy

1. Push this repo to GitHub, public.
2. Import it into Vercel. Add the same env vars from `.env.local` in the
   Vercel project settings (Production + Preview).
3. In the Vercel project, go to the **Marketplace** tab, install **Inngest**,
   and connect it to this project -- it sets `INNGEST_EVENT_KEY` and
   `INNGEST_SIGNING_KEY` automatically and re-syncs functions on every
   deploy.
4. Redeploy once the Inngest integration is connected.

## Project structure

```
app/
  page.tsx                  Submission form
  run/[id]/page.tsx         Status + report page (server component)
  api/runs/route.ts         POST: insert run, fire Inngest event, return id
  api/inngest/route.ts      Inngest's serving endpoint (the step function lives here)
components/
  SubmitForm.tsx            Call-type toggle + transcript textarea
  RunStatus.tsx             Realtime subscription, queued/running/failed/done states
  ReportView.tsx            Grade, one thing, brief, red flags, dimensions, PDF link
  DimensionCard.tsx         One openable dimension with evidence
  ScoreBar.tsx               Band-colored score visualization
lib/
  rubrics/kickoff.ts         Kick-off rubric, encoded as structured data
  rubrics/coaching.ts        Coaching rubric, same
  rubrics/types.ts           Shared types for rubric specs and scored results
  schema.ts                  Builds the Gemini responseSchema + zod validator from a rubric
  gemini.ts                  Prompt construction + the Gemini API call
  verify-quotes.ts           Strips any quote that isn't a verbatim transcript substring
  scoring.ts                 Applies rubric caps deterministically, computes the rescaled total
  pdf.tsx                    The report PDF document + render function
  storage.ts                 Uploads the rendered PDF to Supabase Storage
  functions/score-run.ts     The Inngest step function tying it all together
supabase/migrations/0001_init.sql
```

## Design decisions worth knowing before the Loom

- **Evidence is enforced twice, not once.** The prompt instructs the model
  to return only verbatim quotes or an empty array, but `verify-quotes.ts`
  additionally checks every returned quote against the actual transcript
  text as a substring match, after the fact, in code. A quote that doesn't
  verify is silently dropped rather than trusted -- the report can end up
  saying "no verbatim transcript evidence for this claim" even if the model
  claimed otherwise.
- **Caps are never trusted to the model's arithmetic.** The model reports
  which automatic caps it believes are triggered and why; `scoring.ts`
  applies the actual numeric effect (clamping a dimension, capping the
  total) deterministically in code. This also produces the "which caps
  fired" record the rubric asks for.
- **The coaching rubric's own numbers don't quite add up.** Its 12
  dimension point values literally sum to 105, not the "100 points" the
  document states, and drop to 90 (not the stated 85) when Dimension 4 is
  disabled. Rather than patch specific numbers to force a match, the
  scoring logic always computes raw earned points over the literal sum of
  active dimensions' max points, then rescales that ratio to a clean /100 --
  which is consistent with the rubric's own instruction to report on the
  100 scale when a dimension is switched off, generalized rather than
  hardcoded.
- **Two dimensions can be disabled per call** (coaching Dimension 2 --
  diagnostics, and Dimension 4 -- movement coaching), each with its own
  disable condition given to the model. Disabled dimensions are excluded
  from both the earned-points and available-points totals, not scored as
  zero against their full weight.
- **PDF generation happens server-side**, inside the same Inngest step
  function that produces the scored JSON, and is uploaded to Supabase
  Storage rather than rendered on demand in the browser -- so the PDF is a
  stable, durable artifact of the run itself, matching "the PDF is what the
  client sees."

## What's intentionally out of scope

Per the brief: no voice agent, no scope beyond scoring a pasted kick-off or
coaching transcript. Given the time budget, quote verification is a
substring match rather than a fuzzy/semantic match -- good enough to catch
outright fabrication, though a paraphrased-but-accurate quote could in
theory be flagged as unverified. Worth naming as a known limitation rather
than a silent gap.
