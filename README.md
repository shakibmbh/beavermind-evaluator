# Call Evaluator

Paste a kick-off or coaching call transcript. Get it scored against the
client's rubric — a durable, shareable report plus a downloadable PDF.

**Live:** [beavermind-evaluator.vercel.app](https://beavermind-evaluator.vercel.app)

## Stack

| Layer | Choice | Why |
|---|---|---|
| UI + API | Next.js 15 (App Router) on Vercel | — |
| Database + storage | Supabase (Postgres + Storage) | RLS locked down, PDFs served via signed URLs |
| Background jobs | Inngest | Checkpointed steps, per-step retries, survives tab close |
| Scoring model | Gemini 2.5 Flash | 1M token context, handles the largest sample (~65K chars) |
| PDF rendering | PDFKit | Server-side, no headless browser |
| Validation | Zod | Runtime check on model output, independent of Gemini's schema |
| Tests | Vitest | 36 tests: invariants, dispatch failures, run API |

Free at this scale. No paid subscription required.

## Architecture

The browser never talks to Supabase or Gemini directly.

1. Submit → insert a `runs` row, fire an Inngest event, return a run id immediately.
2. Inngest runs one step at a time:
   `mark running` → `call Gemini` → `resolve cited lines` → `apply caps` → `render + upload PDF` → `mark done`
3. Any failed step retries on its own — the whole run doesn't restart.
4. After retries are exhausted, `onFailure` writes a specific reason to the run.
5. The run page polls an ID-scoped route (never the table directly) and always shows the true state: queued, running, done, or failed-with-reason.

This is what lets someone close the tab and come back to a finished (or still-running) run later.

## How evidence is enforced

- The transcript is parsed into numbered lines (`L1`, `L2`, …) before it reaches Gemini.
- The model cites evidence **by line ID only** — never by retyping or paraphrasing transcript text, even in prose fields like `reasoning` or `brief`.
- The app resolves each cited ID against the real parsed transcript and builds the displayed quote from that lookup.
- A citation either resolves to a real line or it doesn't — no fuzzy matching to game. Unresolved IDs are dropped and counted (`unverifiedQuoteCount`), and surfaced, not hidden.
- No evidence for a dimension → the report says so. It never infers from tone or general mood.
- One of the four sample transcripts exists specifically to test whether the system guesses instead of admitting it has nothing.

**Caps follow the same rule:** the model says whether a cap is *triggered*, never applies its numeric effect — `scoring.ts` does that in code. One cap (coach talk-time share) isn't even asked of the model: it's computed straight from word counts in `talk-time.ts`, since it's a countable fact, not a judgment call.

**Before any of this reaches scoring**, `rubric-invariants.ts` rejects malformed model output — unknown/duplicate IDs, out-of-range scores, illegal score-for-band, a disabled dimension with a nonzero score, a missing required dimension. A failure here triggers a retry, not a report with broken internals.

## What the report contains

- **The one thing** — highest-leverage change, and the score it would produce
- **The brief** — a couple of sentences for whoever's reviewing the coach
- **Red flags** — specific client-churn risks, even under a good score
- **Grade + total** — rescaled to `/100`, mapped to the rubric's bands
- **12 dimensions, each openable** — score, reasoning, supporting lines, quick fix
- **Automatic caps** — shown as binding (cost points) vs. met-but-non-binding
- **Download PDF** — same report, rendered server-side, stored as a durable artifact

## A rubric detail worth knowing

The coaching rubric's 12 dimension points sum to **105**, not the stated 100 — and to 90, not the stated 85, with Dimension 4 disabled. Rather than patch numbers to force a match, `scoring.ts` always rescales earned points over the literal sum of *active* dimensions' max points to a clean `/100`. This generalizes the rubric's own instruction (report on the 100 scale when a dimension is off) instead of hardcoding it.

Two dimensions can be disabled per call — coaching D2 (diagnostics), D4 (movement coaching) — each excluded from both earned and available totals, not scored as zero against full weight.

## Setup

**1. Supabase**
- Create a free project at [supabase.com](https://supabase.com).
- Run the migrations in `supabase/migrations/` in order (SQL editor). Creates `runs`, a private `reports` bucket, and locks down anon access.
- Optional: run `supabase/verify_security.sql` to confirm anon has zero access.
- Grab your project URL + `service_role` key from **Project Settings → API**.

**2. Gemini API key** — free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey), no billing needed.

**3. Local env**
```
npm install
cp .env.example .env.local
# fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY
```

**4. Inngest, locally**
```
npm run dev            # terminal 1
npx inngest-cli dev    # terminal 2 — dashboard at localhost:8288
```

**5. Tests**
```
npm test
```

**6. Deploy**
- Push to GitHub, public.
- Import into Vercel, add the same env vars (Production + Preview).
- In Vercel → Marketplace, install **Inngest** and connect it — sets `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` automatically.
- Redeploy once connected.

## Project structure

```
app/
  page.tsx                       Submission form
  run/[id]/page.tsx              Status + report page
  api/runs/route.ts              POST: insert run, fire event, return id
  api/runs/[id]/route.ts         GET: polled by the run page
  api/inngest/route.ts           Inngest's serving endpoint

components/
  SubmitForm.tsx                 Call-type toggle + transcript input
  RunStatus.tsx                  Polling; queued/running/failed/done
  ReportView.tsx                 Grade, one thing, brief, flags, dimensions, PDF link
  DimensionCard.tsx              One openable dimension, per-turn evidence
  AutomaticCapsCard.tsx          Binding vs. non-binding caps
  RedFlagsCard.tsx               Client-risk flags
  ScoreGauge.tsx / ScoreBar.tsx  Score visuals

lib/
  rubrics/{kickoff,coaching}.ts  Rubrics as structured data
  transcript.ts                  Raw text → numbered speaker turns
  schema.ts                      Gemini responseSchema + zod validator
  gemini.ts                      Prompt + call + line-ID evidence resolution
  rubric-invariants.ts           Rejects malformed model output
  talk-time.ts                   Deterministic coach talk-share calc
  scoring.ts                     Caps + rescaled total, deterministic
  pdf.ts                         Report PDF (PDFKit)
  storage.ts                     Upload PDF → signed URL
  run-response.ts                Shapes browser-facing response
  run-dispatch.ts                Marks a run failed if it never queued
  functions/score-run.ts         The Inngest step function

supabase/
  migrations/                    Schema + RLS lockdown, in order
  verify_security.sql            Manual anon-access check

scripts/
  generate-sample-pdf.mjs        Renders a sample PDF from fixtures, no live services
```

## Known limitations

- **Scope**: no voice agent, nothing beyond scoring a pasted kick-off/coaching transcript — that's the whole brief.
- **Unused dependency**: `@react-pdf/renderer` is still in `package.json` but unused — rendering moved to PDFKit. Pending cleanup, not a design choice.
- **Evidence resolution**: exact by line ID, which rules out false-flagging an accurate paraphrase — but depends on the transcript parsing into `[Speaker]: text` turns. A differently-shaped transcript won't produce citeable lines.

## About

Company, coaches, and clients in the rubrics and sample transcripts are invented. Stage-two hiring exercise for the AI-Native Developer role at BeaverMind, built against a real slice of a production evaluation pipeline with identifying details changed.
