import type { RubricSpec } from "./types";

export const kickoffRubric: RubricSpec = {
  callType: "kickoff",
  bandsReference: [
    { label: "ELITE", range: "90-100", description: "Deep + clear + client confirms. Coach builds real human relationship, not just process." },
    { label: "STRONG", range: "80-89", description: "Clear and useful but lacks emotional depth or consistent reinforcement." },
    { label: "INCONSISTENT", range: "70-79", description: "Technically correct but generic or surface-level in key areas." },
    { label: "AT RISK", range: "60-69", description: "Weak client experience. Client may be doubting the program." },
    { label: "FAIL", range: "<60", description: "Missed core elements, major retention risk." }
  ],
  scoringPrinciples: [
    "Every score is based on three things: depth (how far the coach goes), clarity (how well it lands), and client response (did it actually land).",
    "If it doesn't land, it cannot score elite. A perfect explanation the client didn't confirm is not elite.",
    "Quote-first rationale: every rationale must begin with a direct or paraphrased reference to something that happened in the transcript. Never score from impressions.",
    "Conservative on missing evidence, but within the band: if a behavior can't be verified, score the lower tier of the band the call belongs to. Do not collapse to a lower band entirely -- a call that clearly exceeds Mid but is missing verification of one Elite element scores in the lower tier of Strong, not Mid.",
    "Band-based scoring: each score must fall inside one of the listed bands. Rounding down to Mid needs a stated reason.",
    "The four-sentiment test: would the client leave feeling '(1) this coach gets me, (2) I know exactly what to do next, (3) I trust this process, (4) I'm excited to start' -- not just 'that was informative'."
  ],
  caps: [
    {
      id: "no_followup_questions",
      label: "No follow-up questions anywhere in the call",
      effect: "Caps the total score at 70.",
      scope: "total",
      totalCap: 70
    },
    {
      id: "coach_talks_over_70pct",
      label: "Coach speaks more than 70% of the time without client engagement",
      effect: "Caps the total score at 80.",
      scope: "total",
      totalCap: 80,
      computedBy: "coachTalkShare",
      talkShareThresholdPct: 70
    },
    {
      id: "unresolved_confusion",
      label: "Client shows unresolved confusion at any point in the call",
      effect: "Caps the total score at 75.",
      scope: "total",
      totalCap: 75
    },
    {
      id: "no_north_star",
      label: "No North Star statement constructed",
      effect: "Caps Dimension 4 (Goal Alignment & Deep Why) at 10 of 15.",
      scope: "dimension",
      targetDimensionId: "d4",
      clamp: 10
    }
  ],
  dimensions: [
    {
      id: "d1",
      name: "Pre-Call Preparation",
      max: 10,
      scoringMode: "band",
      scoreRules: [{ band: "Elite", min: 9, max: 10 }, { band: "Strong", min: 6, max: 8 }, { band: "Mid", min: 4, max: 5 }, { band: "Weak", min: 1, max: 3 }, { band: "Fail", scores: [0] }],
      promptSpec: `What to look for: does the coach demonstrate they reviewed the sales notes BEFORE the call -- referencing the client's name, goals, injuries, and context without asking?

Score on conduct, not on disclosure. Credit preparation when the coach demonstrably uses information that could only have come from the sales notes, even if the coach never explicitly says "I read your notes." The verbal acknowledgement is a positive signal, not a requirement.

Bands:
- Elite (9-10): Fully reviewed intake, references goals/name/injuries naturally within the first 2 minutes, no repetition, at least 2 specific details from notes used naturally. Score 10 if delivery is seamless AND at least one verbal acknowledgement is present; 9 otherwise.
- Strong (6-8): Clear evidence of preparation in the content, with a small gap (one factual misstep, slightly delayed reference, or one redundant question). Letting the client voluntarily share context for relational warmth is NOT a deduction. Score 8 for a minor gap clearly outweighed by solid prep; 6 for real but uneven prep.
- Mid (4-5): Partial preparation, several redundant questions or a generic low-personalization intro, reads notes mechanically. Reserve for visibly thin prep, not for solid-but-unannounced prep.
- Weak (1-3): Minimal preparation, one or two surface references, client does most of the context-setting.
- Fail (0): Clearly unprepared -- asks the client's name or what brought them here.

Calibration (do not deviate): Do NOT default to Mid just because the coach didn't say "I read your notes." Do NOT drop a strong call to Mid for a single misstep (e.g. wrong city) when the rest of prep is solid -- score 6-8 instead.`
    },
    {
      id: "d2",
      name: "Rapport & Tone",
      max: 10,
      scoringMode: "band",
      scoreRules: [{ band: "Elite", scores: [10] }, { band: "Strong", scores: [7] }, { band: "Mid", scores: [3] }, { band: "Fail", scores: [0] }],
      promptSpec: `What to look for: does a genuine human connection form? Does the coach adapt their energy to the client? Does the client open up?

Buckets:
- 10 Elite: warm, calm, personalized, matches client energy, natural/non-scripted, uses client's name organically, shares something personal, client opens up spontaneously.
- 7 Strong: friendly but surface-level, warm and conversational but not deeply personal, little emotional mirroring.
- 3 Mid: mechanical/scripted feel, friendly but transactional, light conversation without real connection.
- 0 Fail: cold, rushed, transactional, skips rapport entirely, client gives monosyllabic answers.`
    },
    {
      id: "d3",
      name: "Agenda Framing",
      max: 5,
      scoringMode: "band",
      scoreRules: [{ band: "Elite", min: 4.5, max: 5, step: 0.5 }, { band: "Mid", min: 2.5, max: 3.5, step: 0.5 }, { band: "Weak", min: 1, max: 2 }, { band: "Fail", scores: [0] }],
      promptSpec: `What to look for: does the coach take control of the call structure upfront and communicate what will happen?

Numbered enumeration is NOT required. A sequenced delivery covering at least 3 distinct phases ("first... then... and finally...", or comma/and-connected items), paired with explicit time framing and at least implicit client buy-in, qualifies as structured.

Bands:
- Elite (4.5-5): explicit time framing AND >=3 sequenced phases (numbered or natural-language) AND client verbal consent. 5 when crisp; 4.5 when present and sequenced but slightly informal.
- Mid (2.5-3.5): agenda mentioned but partial -- time framing missing, fewer than 3 phases, or no client buy-in.
- Weak (1-2): brief or fragmented mention of what's coming, no sequencing.
- Fail (0): no upfront structure, launches into random topics.

Calibration (do not deviate): a coach who says "we've got 30 minutes -- connect, get aligned on your goals, what success looks like, walk you through the journey, get clear on support, and schedule the next call" is Elite-level agenda framing even without numbered enumeration. Score 4.5-5, not 3.`
    },
    {
      id: "d4",
      name: "Goal Alignment & Deep Why",
      max: 15,
      scoringMode: "band",
      scoreRules: [{ band: "Elite", scores: [15] }, { band: "Strong", scores: [10] }, { band: "Mid", scores: [5] }, { band: "Fail", scores: [0] }],
      promptSpec: `What to look for: does the coach go beyond functional goals to uncover the emotional/identity driver? Is a North Star statement built?

Buckets:
- 15 Elite: extracts emotional/identity driver (fear, family, legacy, career, self-image), >=2 follow-up questions on "why", builds an explicit North Star statement ("What I hear you saying is you want to be..."), defines a specific 30-day success metric, client verbally confirms.
- 10 Strong: understands goals but stays surface level, 1 follow-up + some emotional context, 30-day goal vague, North Star implied but not solidified.
- 5 Mid: mostly repeats sales notes, asks "what are your goals?" and accepts the first answer, stays physical only, no probing, no North Star.
- 0 Fail: no meaningful alignment, accepts a generic answer and moves on.

Auto-cap: no North Star statement constructed -> max 10 (applied regardless of how deep the rest of the dimension scores).`
    },
    {
      id: "d5",
      name: "Program Explanation (3 Phases)",
      max: 10,
      scoringMode: "band",
      scoreRules: [{ band: "Elite", min: 9, max: 10 }, { band: "Strong", min: 6, max: 8 }, { band: "Mid", min: 3, max: 5 }, { band: "Weak", min: 1, max: 2 }, { band: "Fail", scores: [0] }],
      promptSpec: `What to look for: does the client leave understanding the 3-phase program structure and why it exists?

Canonical 3-phase naming: (1) Movement Retraining -- restore movement quality, address asymmetries. (2) Movement Remodeling -- load and rebuild new patterns into strength. (3) Movement Integrating -- integrate full-capacity movement into life/sport. Accept ANY phrasing conveying the same three-stage progression in order (e.g. Reset/Build/Freedom, or "rebuild the foundation -> load the pattern -> free movement"). Do not penalize the canonical naming either.

Bands:
- Elite (9-10): all 3 phases named (any equivalent phrasing) with outcomes for each, an analogy or reassessment cadence used, each phase tied to the client's specific goal.
- Strong (6-8): all 3 phases identified in correct order but delivery is simple/generic, or phases aren't tied to specific goals, or no analogy/cadence, or coach doesn't check understanding. 8 when crisp and complete; 6 when brief.
- Mid (3-5): fragmented, 1-2 phases mentioned vaguely, or progression implied but not sequenced.
- Weak (1-2): only references to "phases"/"steps" without naming or sequencing.
- Fail (0): no phase explanation at all.

Calibration (do not deviate): "Movement Retraining -> Remodeling -> Integrating" is correct canonical naming -- credit as Elite-tier phase identification, do not drop the score for not using "Reset/Build/Freedom".`
    },
    {
      id: "d6",
      name: "Journey & Expectation Setting",
      max: 10,
      scoringMode: "band",
      scoreRules: [{ band: "Elite", scores: [10] }, { band: "Strong", scores: [7] }, { band: "Mid", scores: [3] }, { band: "Fail", scores: [0] }],
      promptSpec: `What to look for: does the coach prepare the client emotionally for the difficulty of the journey, not just the logistics?

Buckets:
- 10 Elite: explains milestones/timeline/challenges, explicitly normalizes emotional friction ("there will be a week you feel like you're not progressing -- that's normal"), explains valleys (weeks 3-4), distinguishes good discomfort from bad pain, explains month 1 is foundational not transformational, links back to the North Star.
- 7 Strong: covers basics but misses emotional prep, timeline/structure explained, normalizes physical discomfort but not emotional, missing psychological prep for valleys.
- 3 Mid: vague expectations, informative but not experiential, explains what will happen but not how it will feel.
- 0 Fail: no expectation setting, leaves client with unrealistic expectations, doesn't mention hard moments will happen.`
    },
    {
      id: "d7",
      name: "Support System Clarity",
      max: 5,
      scoringMode: "band",
      scoreRules: [{ band: "Elite", scores: [5] }, { band: "Mid", scores: [3] }, { band: "Fail", scores: [0] }],
      promptSpec: `Scope note: this dimension scores ONLY what is said in the call, not whether follow-up actually landed afterwards. Set disabled: false always for this dimension.

What to look for: does the coach communicate, in-call, exactly how the client will be supported between sessions -- primary channel, response expectations, community access, accountability style?

Buckets:
- 5 Elite: primary channel named explicitly, response time stated, community platform/access mentioned, accountability style asked or framed, client visibly understands how to reach the coach.
- 3 Mid: support mentioned but unclear usage -- channel mentioned but no response times, vague "reach out anytime" without structure, no accountability framing.
- 0 Fail: not explained at all, no channel named, no response-time expectations.`
    },
    {
      id: "d8",
      name: "Coaching Intelligence Questions",
      max: 10,
      scoringMode: "band",
      scoreRules: [{ band: "Elite", scores: [10] }, { band: "Strong", scores: [7] }, { band: "Mid", scores: [3] }, { band: "Fail", scores: [0] }],
      promptSpec: `What to look for: does the coach gather information beyond logistics -- behavioral patterns, psychology, personalization?

Buckets:
- 10 Elite: asks about behavioral patterns ("what has stopped you before?"), consistency triggers, learning style, stress response, and uses the answers to personalize the coaching approach.
- 7 Strong: asks 1-2 but lacks depth (pain triggers, schedule, training style); missing behavioral pattern or mindset questions; doesn't use answers to adapt.
- 3 Mid: only generic/basic questions (frequency, equipment, availability), surface-level.
- 0 Fail: skipped entirely, only logistical questions asked, client not truly known.`
    },
    {
      id: "d9",
      name: "Next Steps & Diagnostics",
      max: 10,
      scoringMode: "band",
      scoreRules: [{ band: "Elite", scores: [10] }, { band: "Strong", scores: [7] }, { band: "Mid", scores: [3] }, { band: "Fail", scores: [0] }],
      promptSpec: `What to look for: does the client leave knowing exactly what to do and when?

Buckets:
- 10 Elite: clear pipeline stated (diagnostics -> film -> upload -> program -> start date), explains how to film (angle/device), removes confusion, specific timing stated, client verbally confirms understanding.
- 7 Strong: some clarity but minor confusion -- clear instructions but no demo, timeline ok but slightly rushed.
- 3 Mid: vague instructions, partially clear, unresolved doubts, no specific timeline.
- 0 Fail: no clear next steps at all, "I'll send you some stuff" without explanation.`
    },
    {
      id: "d10",
      name: "Booking Next Call",
      max: 5,
      scoringMode: "band",
      scoreRules: [{ band: "Elite", min: 4.5, max: 5, step: 0.5 }, { band: "Mid", min: 2.5, max: 3.5, step: 0.5 }, { band: "Weak", min: 1, max: 2 }, { band: "Fail", scores: [0] }],
      promptSpec: `What to look for: is the next call booked LIVE, verbally, before the call ends?

Booking is verbal, not technical -- whether the calendar invite is technically clicked on-screen during the call versus immediately after is an artifact of the recording and is NOT a deduction.

Bands:
- Elite (4.5-5): date and time confirmed verbally, scheduling constraints (time zones, availability, conflicts) navigated live. 5 when crisp and coach proactively closes it; 4.5 when confirmed but slightly rushed.
- Mid (2.5-3.5): booking attempted but not fully secured -- coach raises it but leaves excessive flexibility ("I'll send you a link", "we'll organize via message") instead of locking date+time live.
- Weak (1-2): booking referenced only in passing, no concrete attempt to lock it in.
- Fail (0): not addressed at all.

Calibration (do not deviate): if date and time are confirmed verbally and any scheduling friction is resolved live, score 5/5 -- even if the transcript doesn't explicitly confirm the calendar invite was technically sent during the recording.`
    },
    {
      id: "d11",
      name: "Close, Recap & Confidence",
      max: 5,
      scoringMode: "band",
      scoreRules: [{ band: "Elite", scores: [5] }, { band: "Mid", scores: [3] }, { band: "Fail", scores: [0] }],
      promptSpec: `What to look for: does the call end with energy, structure, and an emotional anchor -- not just logistics?

Buckets:
- 5 Elite: structured recap ("here's what we covered today: X, Y, Z"), a confidence anchor ("you're in the right place"), emotional reinforcement/excitement. Does NOT end with only logistics.
- 3 Mid: basic close -- positive but no structured recap, generic encouragement without an anchor, or a flat "ok, talk soon."
- 0 Fail: abrupt or unclear ending, client leaves without feeling excited.

Note: even elite calls commonly score 3-4/5 here -- a missing structured recap is the most universal gap. If there's no structured recap, cap this dimension at 3.`
    },
    {
      id: "d12",
      name: "Post-Call Execution",
      max: 5,
      scoringMode: "band",
      scoreRules: [{ band: "Elite", min: 4.5, max: 5, step: 0.5 }, { band: "Strong", min: 3.5, max: 4, step: 0.5 }, { band: "Mid", min: 2, max: 3 }, { band: "Weak", scores: [1] }, { band: "Fail", scores: [0] }],
      promptSpec: `Scope note: this dimension scores ONLY what is committed to, in the call. Verification of actual delivery afterward is out of scope. Set disabled: false always.

What to look for: does the coach commit, in-call, to specific post-call deliverables with concrete deadlines?

Informal commitments still count -- a specific commitment with rough timing (e.g. "I'll get your diagnostics done over the weekend") is a real promise and belongs in Mid, not Fail. Reserve Fail for no commitment at all.

Bands:
- Elite (4.5-5): multiple explicit commitments with precise deadlines (recap timing, diagnostics assigned live, program delivery date). 5 for 3+ commitments with crisp timing; 4.5 for 2+ with precise timing.
- Strong (3.5-4): two or more commitments with mostly precise timing, minor gaps.
- Mid (2-3): at least one specific commitment but timing is rough, or only one or two commitments -- including informal-but-real ones.
- Weak (1): vague reference to follow-up ("I'll send you stuff") with no specific deliverable or timing.
- Fail (0): no post-call commitments stated at all.

Calibration (do not deviate): "I'll get the diagnostics done over the weekend" is real but soft -- score Mid (2-3), not Fail.`
    }
  ]
};
