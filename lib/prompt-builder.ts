import { PreprocessingResult } from "./preprocessor";

const KICKOFF_RUBRIC = `
# Kick-off Call — Scoring Rubric

Twelve dimensions, 100 points total. Every score is grounded in direct transcript evidence: specific moments, quotes, or observable behaviours. Never score from assumptions or general impressions.

## Global Automatic Caps
- No follow-up questions anywhere → Max 70 total
- Coach speaks >70% without client engagement → Max 80 total
- Client shows unresolved confusion → Max 75 total
- No North Star statement → D4 max 10/15
- No structured recap → D11 max 3/5

## Dimensions

### D1 — Pre-Call Preparation (10 pts)
**Elite (9-10):** Fully reviewed intake. References goals, name, injuries within first 2 min. Uses ≥2 specific details from notes naturally. Seamless delivery.
**Strong (6-8):** Clear evidence of prep but small gap: one misstep, delayed reference, or one redundant question.
**Mid (4-5):** Partial prep. Some notes used but several redundant questions or generic intro.
**Weak (1-3):** Minimal prep. One or two surface references.
**Fail (0):** Clearly unprepared. Asks name or "what brought you here."
> Credit content over disclosure. Coach who references specific details without saying "I read your notes" still scores Strong+.

### D2 — Rapport & Tone (10 pts)
**10:** Warm, calm, personalized, matches client energy. Natural conversation. Client opens up with personal stories.
**7:** Friendly but surface-level. Warm but not deeply personal.
**3:** Mechanical/scripted feel. Transactional.
**0:** Cold, rushed, skips rapport. Monosyllabic client.

### D3 — Agenda Framing (5 pts)
**Elite (4.5-5):** Clear agenda with explicit time framing AND ≥3 sequenced phases AND client verbal consent.
**Mid (2.5-3.5):** Agenda mentioned but partial — time missing, <3 phases, or no buy-in.
**Weak (1-2):** Brief/fragmented mention without sequencing.
**Fail (0):** No upfront structure.
> Numbered enumeration NOT required. Natural-language sequencing qualifies.

### D4 — Goal Alignment & Deep Why (15 pts)
**15:** Extracts emotional drivers + 30-day success metrics. ≥2 follow-up "why" questions. Builds North Star. Client confirms.
**10:** Understands goals but surface level. 1 follow-up. 30-day goal vague. North Star implied.
**5:** Repeats sales notes. Accepts first answer. Stays physical only. No probing.
**0:** No meaningful alignment. Skips or rushes.
> Auto-cap: No North Star → max 10.

### D5 — Program Explanation (10 pts)
**Elite (9-10):** All 3 phases named with outcomes. Uses analogy or reassessment cadence. Each phase tied to client goal. Client understands WHY.
**Strong (6-8):** All 3 phases identified in correct order but simple/generic. Missing analogy or goal tie.
**Mid (3-5):** Fragmented. 1-2 phases mentioned vaguely.
**Weak (1-2):** Only references "phases" without naming/sequencing.
**Fail (0):** Skips or misrepresents.
> Accept ANY phrasing conveying 3-stage progression in correct order. Legacy synonyms: Reset/Baseline → Build/Strength → Freedom/Mastery.

### D6 — Journey & Expectation Setting (10 pts)
**10:** Explains milestones, timeline, challenges. Normalizes emotional friction explicitly. Distinguishes good discomfort from bad pain. First month = foundational not transformational. Links to North Star.
**7:** Covers basics but misses emotional prep. Missing valley prep.
**3:** Vague expectations. Explains what but not how it will feel.
**0:** No expectation setting. Unrealistic expectations.

### D7 — Support System Clarity (5 pts)
**5:** All channels + when to use each. Primary channel named. Response time stated. Community mentioned. Accountability style asked.
**3:** Mentions support but unclear. No response times. No accountability framing.
**0:** Not explained. No channel named.
> Scores what is SAID in the call, not whether follow-up actually landed.

### D8 — Coaching Intelligence Questions (10 pts)
**10:** Asks behavioral + self-awareness questions. Probes consistency triggers, learning style, stress response. Uses answers to personalize.
**7:** Asks 1-2 but lacks depth. Missing behavioral pattern questions.
**3:** Generic questions only. Basic logistics.
**0:** Skipped. Only "when are you available?"

### D9 — Next Steps & Diagnostics (10 pts)
**10:** Clear pipeline. Explains how to film. Removes all confusion. Time specified. Client confirms.
**7:** Some clarity but minor confusion. No demo. Slightly rushed.
**3:** Vague instructions. Partially clear. No specific timeline.
**0:** No clear next steps. "I'll send you some stuff."

### D10 — Booking Next Call (5 pts)
**Elite (4.5-5):** Date and time confirmed verbally. Navigates scheduling constraints live.
**Mid (2.5-3.5):** Attempted but not fully secured. "I'll send you a link."
**Weak (1-2):** Referenced in passing. No concrete attempt.
**Fail (0):** Not addressed.
> Booking is VERBAL, not technical. Verbal confirmation of date/time = Elite.

### D11 — Close, Recap & Confidence (5 pts)
**5:** Strong recap. Confidence anchor. Emotional reinforcement. Does NOT end with only logistics.
**3:** Basic close. Positive but no structured recap or emotional anchor.
**0:** Abrupt or unclear. Client leaves without excitement.
> Cap: no structured recap → max 3.

### D12 — Post-Call Execution (5 pts)
**Elite (4.5-5):** Multiple explicit commitments with precise deadlines.
**Strong (3.5-4):** Two+ commitments with mostly precise timing.
**Mid (2-3):** At least one specific commitment but timing rough.
**Weak (1):** Vague reference without specific deliverable.
**Fail (0):** No post-call commitments.
> Informal commitments with implied timing ("over the weekend") = Mid, not Fail.

## Scoring Bands
- Elite: 90-100
- Strong: 80-89
- Inconsistent: 70-79
- At Risk: 60-69
- Fail: <60
`;

const COACHING_RUBRIC = `
# Coaching Call — Scoring Rubric

Twelve dimensions, 100 points when D4 active, 85 when D4 disabled. Three pillars: Connection, Confidence, Continuity.

## Global Automatic Caps
- Next call NOT booked live → D10 = 0/5 (non-recoverable)
- No long-term vision connection → D3 max 10/15
- Coach speaks >75% → Max 75 total
- No concrete accountability commitment client owns → D6 max 10/15
- Client struggle ignored → D8 = 0/5 (non-recoverable)
- No action steps for either party → Max 70 total

## Dimensions

### D1 — Check-In & Connection (10 pts)
**10:** Asks body, wins, AND struggles. Listens before responding. Reflects back. States clear call intention tied to client state.
**7:** Good questions but limited depth. Generic call intention.
**3:** Surface-level. Moves to program in 30 seconds. No call intention.
**0:** Skips check-in. Launches directly into content.

### D2 — Diagnostics Review (10 pts)
**10:** Screen shares 1-2 movements. Specific anatomical observations. Tied directly to client goals. Client understands connection.
**7:** Good observations but not fully tied to goals.
**3:** Generic feedback. No tie to goals. Too many movements.
**0:** Skipped, rushed, or unclear.
> If not applicable this cycle (non-milestone, no video), score N/A.

### D3 — Program Focus + Vision (15 pts)
**15:** Block explained. Explicitly connects to 12-month vision by name. Reinforces Halden Method difference. Client responds with belief.
**10:** Block explained and connected but vision tie is generic.
**5:** Vague explanation. Block as logistics only. No 12-month vision.
**0:** No explanation. "Keep doing your workouts."
> Auto-cap: No long-term vision → max 10.

### D4 — Movement Coaching Quality (15 pts) — OPTIONAL
> Disable when no movement coaching occurred. Set disabled=true if ALL four are absent:
> 1. Client performed live movement
> 2. Coach gave setup/breathing/control cues
> 3. Video review of recorded movement with feedback
> 4. Real-time form correction
> If even ONE is present, score normally.
**15:** Reviews 1-2 movements live. Specific cues. Reflective questions. Improvement observable. Links to goal.
**10:** Clear coaching but missing reflective questions or goal link.
**5:** Mostly telling. No reflective questions. No exchange.
**0:** No live coaching. Just commentary.

### D5 — Adjustments & Strategy (10 pts)
**10:** Adjustments explained with rationale tied to long game. Framed as protection: "We're adapting — not backing off." Client feels smarter.
**7:** Adjustments made and explained but brief framing.
**3:** Adjustments without clear rationale. Subtle discouragement.
**0:** Reactive, unexplained. Client confused.
> If no adjustments needed, score 7 by default.

### D6 — Action Steps & Accountability (15 pts)
**15:** Both sides have specific, time-bound, measurable commitments. Client owns weekly theme in own words. Micro-commitments if slipping.
**10:** Clear but lacks specific deadlines. One side more accountable.
**5:** Vague: "Do your workouts." No deadline. No ownership.
**0:** No clear next steps for either party.
> Auto-cap: No concrete accountability → max 10.

### D7 — Accountability Anchor (5 pts)
**5:** Clear commitment client owns and verbally confirms, gated to coach action. One named anchor OR progression-gated deliverable.
**3:** Accountability gestured at but NOT clearly gated to coach action.
**0:** No anchor. Multiple vague tasks.

### D8 — Struggle Handling (5 pts)
**5:** Does NOT defend or take personally. Stays grounded. Asks questions before solutions. Reconnects to why. Offers options.
**3:** Acknowledges struggle and offers some support. Doesn't fully coach through.
**0:** Struggle ignored, minimized, or coach defensive. Auto-cap: 0 if struggle present but ignored.
> If NO struggle present → score 5 by default.

### D9 — Close Quality (5 pts)
**5:** Celebrates specific named progress from THIS call. Reiterates direction. Client leaves energized.
**3:** Positive close but generic celebration or no direction.
**0:** Abrupt end. No emotional reinforcement.

### D10 — Next Call Booking (5 pts)
**5:** Booked live. Date confirmed verbally. "We're locked in."
**0:** Not booked live. Auto-cap: 0 if not booked.

### D11 — Continuity & Follow-Up Clarity (5 pts)
**5:** Coach restates anchor. States own follow-up with specific timing. Clear chain: client does X by Y → coach delivers Z by W.
**3:** Follow-up mentioned but vague timing.
**0:** No post-call structure.
> Only in-call promise is scored. Actual delivery is N/A.

### D12 — Structure & Time Management (5 pts)
**5:** Call flows naturally. Pacing smooth. Close and booking not rushed. Framework woven in, not announced.
**3:** Slightly uneven. One section rushed or bloated.
**0:** Disorganized. Core sections missing.

## Scoring Bands
- Elite: 90-100
- Strong: 80-89
- Inconsistent: 70-79
- At Risk: 60-69
- Fail: <60
`;

export function buildPrompt(
  callType: "kickoff" | "coaching",
  transcript: string,
  preprocessing: PreprocessingResult
): string {
  const rubric = callType === "kickoff" ? KICKOFF_RUBRIC : COACHING_RUBRIC;
  return `You are a Halden Method call quality evaluator. Evaluate a call transcript against a scoring rubric using ONLY observable, verbatim evidence from the transcript.

CRITICAL RULES — Violating these will produce incorrect output:
1. Evidence first. For every dimension, you MUST cite specific verbatim quotes from the transcript before assigning a score.
2. If a behavior is NOT present in the transcript, write "NOT OBSERVED" — never infer, assume, or read mood.
3. For Kick-off calls: use band-based scoring. Any integer within a band is valid (halves allowed for dimensions with max ≤ 5).
4. For Coaching calls: use DISCRETE scoring. The score MUST be exactly one of the bucket values listed. No interpolation.
5. One of the transcripts is designed to catch systems that guess. If you cannot verify a behavior in text, it does not exist.
6. For Coaching D4: set disabled=true ONLY if ALL four criteria are absent. If even ONE movement coaching indicator is present, score normally and set disabled=false.
7. If NO client struggle is present in a coaching call, D8 scores 5 by default (not penalized for smooth call).
8. If diagnostics not applicable (non-milestone week, no video submitted), D2 is N/A for coaching.

TRANSCRIPT PREPROCESSING STATS (calculated deterministically from the transcript):
- Coach word count: ${preprocessing.coach_word_count}
- Client word count: ${preprocessing.client_word_count}
- Coach speaking percentage: ${preprocessing.coach_percentage.toFixed(1)}%
- Total turns: ${preprocessing.total_turns}
- Has follow-up questions: ${preprocessing.has_follow_up_questions}
- Has North Star: ${preprocessing.has_north_star}
- Has structured recap: ${preprocessing.has_structured_recap}
- Has live booking: ${preprocessing.has_live_booking}
- Has long-term vision: ${preprocessing.has_long_term_vision}
- Has concrete accountability: ${preprocessing.has_concrete_accountability}
- Has client struggle: ${preprocessing.has_client_struggle}
- Has action steps: ${preprocessing.has_action_steps}
- Has movement coaching indicators: ${preprocessing.has_movement_coaching}
- Has unresolved confusion: ${preprocessing.has_unresolved_confusion}
- Struggle addressed: ${preprocessing.struggle_addressed}

Use these stats as hints, but verify everything against the actual transcript text. Do NOT trust the stats blindly — they are heuristics.

FULL RUBRIC:
${rubric}

TRANSCRIPT TO EVALUATE:
\`\`\`
${transcript}
\`\`\`

OUTPUT FORMAT — Return strict JSON matching this exact schema:
{
  "evidence": [
    {
      "dimension_id": "D1",
      "criterion": "Specific goals referenced from notes",
      "speaker": "Coach",
      "verbatim": "exact quote from transcript",
      "interpretation": "why this matters for scoring",
      "impact": "positive" | "negative" | "neutral"
    }
  ],
  "dimension_scores": [
    {
      "id": "D1",
      "score": 9,
      "band": "Elite",
      "reasoning": "Coach demonstrated preparation by referencing...",
      "evidence_refs": [0, 1],
      "quick_fix": "To reach full marks, the coach should..."
    }
  ],
  "caps_identified": [
    {
      "condition": "No follow-up questions",
      "applies": false,
      "reason": "Coach asked multiple follow-up questions in D4 section"
    }
  ],
  "d4_disabled": false,
  "d4_disabled_reason": null,
  "preprocessing_notes": {
    "coach_word_count": ${preprocessing.coach_word_count},
    "client_word_count": ${preprocessing.client_word_count},
    "coach_percentage": ${preprocessing.coach_percentage},
    "has_follow_up_questions": ${preprocessing.has_follow_up_questions},
    "has_north_star": ${preprocessing.has_north_star},
    "has_structured_recap": ${preprocessing.has_structured_recap},
    "has_live_booking": ${preprocessing.has_live_booking},
    "has_long_term_vision": ${preprocessing.has_long_term_vision},
    "has_concrete_accountability": ${preprocessing.has_concrete_accountability},
    "has_client_struggle": ${preprocessing.has_client_struggle},
    "has_action_steps": ${preprocessing.has_action_steps},
    "has_movement_coaching": ${preprocessing.has_movement_coaching},
    "has_unresolved_confusion": ${preprocessing.has_unresolved_confusion},
    "struggle_addressed": ${preprocessing.struggle_addressed}
  }
}

IMPORTANT:
- Provide at least 1-2 evidence items per dimension scored.
- For dimensions where behavior is NOT OBSERVED, still provide an evidence item noting its absence and score conservatively.
- The "quick_fix" should be a single, actionable sentence telling the coach exactly what to do next time to reach full marks.
- Be conservative. If evidence is borderline, score in the lower tier of the band.
`;
}
