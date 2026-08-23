import type { RubricSpec } from "./types";

export const coachingRubric: RubricSpec = {
  callType: "coaching",
  bandsReference: [
    { label: "ELITE", range: "90-100", description: "Client feels seen, challenged, and connected to their future self. Referral and re-sign behavior expected." },
    { label: "STRONG", range: "80-89", description: "Good call with isolated weaknesses. Client satisfied but not deeply moved." },
    { label: "INCONSISTENT", range: "70-79", description: "Technically present but emotionally flat. Retention risk building quietly." },
    { label: "AT RISK", range: "60-69", description: "Weak client experience. Client may be doubting the process." },
    { label: "FAIL", range: "<60", description: "Core elements missing. Immediate coaching intervention required." }
  ],
  scoringPrinciples: [
    "Three-part test for every score: depth (how far the coach went), clarity (how well it landed), client response (did it actually land). A perfect explanation the client didn't confirm is not elite.",
    "Quote-first rationale: every rationale must begin with a direct or paraphrased reference to a specific moment in the transcript. No impressions.",
    "Conservative on missing evidence: if a behavior can't be verified, score the lower tier of its band.",
    "The four client feelings are the test: would the client leave this section feeling 'this is built for me / I know exactly what to do / I trust this process / my coach is paying attention'?",
    "Framework use is judged by naturalness, not completeness. A coach who covers all sections robotically scores LOWER on D12 than one who weaves them in organically.",
    "Discrete scoring: each score must be exactly one of the listed bucket values. No interpolation -- pick the closest bucket and let the reasoning carry the nuance."
  ],
  caps: [
    {
      id: "no_live_booking",
      label: "Next call NOT booked live during the call",
      effect: "Forces Dimension 10 (Next Call Booking) to 0 of 5. Non-recoverable.",
      scope: "dimension",
      targetDimensionId: "d10",
      clamp: 0
    },
    {
      id: "no_long_term_vision",
      label: "No connection to long-term vision anywhere in the call",
      effect: "Caps Dimension 3 (Program Focus + Vision) at 10 of 15.",
      scope: "dimension",
      targetDimensionId: "d3",
      clamp: 10
    },
    {
      id: "coach_talks_over_75pct",
      label: "Coach speaks more than 75% of the call (client passive / monologue)",
      effect: "Caps the total score at 75.",
      scope: "total",
      totalCap: 75,
      computedBy: "coachTalkShare",
      talkShareThresholdPct: 75
    },
    {
      id: "no_owned_accountability",
      label: "No concrete accountability commitment the client owns before close -- no specific, verifiable deliverable the client confirms. A single named anchor OR a progression-gated ask (client confirms) both satisfy this and do NOT trigger the cap.",
      effect: "Caps Dimension 6 (Action Steps & Accountability) at 10 of 15.",
      scope: "dimension",
      targetDimensionId: "d6",
      clamp: 10
    },
    {
      id: "struggle_ignored",
      label: "Client struggle present but ignored, minimized, avoided, or coach becomes defensive",
      effect: "Forces Dimension 8 (Struggle Handling) to 0 of 5. Non-recoverable.",
      scope: "dimension",
      targetDimensionId: "d8",
      clamp: 0
    },
    {
      id: "no_action_steps",
      label: "No action steps stated for either party before close",
      effect: "Caps the total score at 70.",
      scope: "total",
      totalCap: 70
    }
  ],
  dimensions: [
    {
      id: "d1",
      name: "Check-In & Connection",
      max: 10,
      scoringMode: "discrete",
      promptSpec: `Pillar: CONNECTION. What to look for: does the coach open with genuine curiosity and gauge the client's real state before anything else? Is a call intention set explicitly?

Buckets:
- 10 Elite: asks about body, wins, AND struggles; listens without interrupting; reflects back what they hear ("what I'm hearing is..."); states a clear call intention tied to the client's actual state; reads what kind of call is needed and adjusts.
- 7 Strong: good questions but limited depth, reflects but not fully, call intention stated but generic ("let's keep making progress on your goals").
- 3 Surface: surface-level ("how's it going?"), doesn't reflect, moves to program topics within 30 seconds, no call intention stated.
- 0 Fail: skips check-in entirely or rushes through, no acknowledgment of client's state, launches directly into program content.

Calibration (do not deviate): the check-in is how the coach gauges what kind of call the client needs today -- the framework is a container, not a script. If someone opens up in distress, the coach abandoning the standard framework to meet them there IS the framework working, not a deduction.`
    },
    {
      id: "d2",
      name: "Diagnostics Review",
      max: 10,
      scoringMode: "discrete",
      optional: true,
      disableHint: "Set disabled: true with band N/A only if this call had no milestone diagnostics review at all (non-milestone call, no video submitted this session). Score normally otherwise.",
      promptSpec: `Pillar: VALUE. Only fully applicable at milestone weeks (8, 16, 24). What to look for: does the coach demonstrate expertise through specific, personalized feedback on 1-2 movements (not more), tied directly to client goals?

Buckets:
- 10 Elite: reviews only 1-2 movements, specific anatomically-precise observations, directly ties findings to the client's stated pain points/goals, client clearly understands the connection.
- 7 Strong: good observations but not fully tied to goals, correct number of movements reviewed.
- 3 Surface: generic feedback ("good effort, keep your back straight"), no tie to goals, possibly reviews too many movements.
- 0 Fail: skipped, rushed, or unclear, feedback generic or absent.

Scoring note: if diagnostics are not applicable this cycle (non-milestone call, no video submitted), set disabled: true, band "N/A", score 0, and give a short disabled_reason. Do not penalize the coach for this.`
    },
    {
      id: "d3",
      name: "Program Focus + Vision",
      max: 15,
      scoringMode: "discrete",
      promptSpec: `Pillar: EMOTION -- belief + long-term buy-in. What to look for: does the coach connect the current block to the client's 12-month vision and identity, or only talk about this week?

Buckets:
- 15 Elite: explains what the current block targets, explicitly connects this phase to the client's 12-month vision BY NAME, reinforces the program's differentiated approach ("we build from your diagnostics and goals, not random workouts"), client responds with belief or insight -- understands not just WHAT but WHY this block at this time.
- 10 Strong: block explained and connected to goals but the vision tie is generic ("this builds toward your long-term health"), emotional resonance present but not sharp.
- 5 Mid: vague, block explained as logistics only, client understands what to do this week but not why it matters long-term, no 12-month vision referenced.
- 0 Fail: no explanation of the block at all, just "keep doing your workouts", no connection to vision.

Auto-cap: no long-term vision connection anywhere in the call -> max 10.`
    },
    {
      id: "d4",
      name: "Movement Coaching Quality",
      max: 15,
      scoringMode: "discrete",
      optional: true,
      disableHint: `Disable ONLY when ALL FOUR of these are absent: (1) client performed any live movement during the call, (2) coach gave setup/breathing/control cues in response to a movement, (3) there was a video review of a recorded movement attempt with real-time feedback, (4) coach gave real-time form correction while the client moved. If even one is present, score normally. If disabling, set disabled: true, band "N/A", score 0, with a short disabled_reason like "no movement coaching on this call -- session was entirely strategy/accountability".`,
      promptSpec: `Pillar: SUPPORT -- real coaching, not commentary. What to look for: does something actually improve or click during this call? Is the coach coaching, or just narrating?

Buckets:
- 15 Elite: reviews 1-2 movements live, specific cues (setup/breathing/control), asks reflective questions ("where do you feel this most?"), improvement observable or client verbally confirms new understanding, links back to the client's goal, redirects "talkers" to live movement.
- 10 Strong: clear coaching and relevant cues but missing reflective questions or a goal link; client engaged but no breakthrough or redirection.
- 5 Mid: mostly telling ("keep your back straight"), no reflective questions, no back-and-forth exchange.
- 0 Fail: no live coaching, just commentary or "looks fine", client is a passive observer.`
    },
    {
      id: "d5",
      name: "Adjustments & Strategy",
      max: 10,
      scoringMode: "discrete",
      promptSpec: `Pillar: GOALS -- adaptability + confidence. What to look for: when adjustments are made (training or lifestyle), are they framed as intelligent, strategic progress -- or a step backward?

Buckets:
- 10 Elite: adjustments explained with clear rationale tied to the client's long game, explicitly framed as protection/strategy ("we're adapting, not backing off -- this protects the long game"), client leaves feeling smarter and more confident.
- 7 Strong: adjustments made and explained, framing present but brief, client not discouraged but not fully empowered either.
- 3 Surface: adjustments made without clear rationale, client accepts changes but doesn't understand why, subtle discouragement possible.
- 0 Fail: reactive, unexplained changes, client confused or mildly demoralized.

Scoring note: if no adjustments were needed this cycle at all, score 7/10 by default (strategic awareness still visible in how program status is communicated) rather than treating it as a gap.`
    },
    {
      id: "d6",
      name: "Action Steps & Accountability",
      max: 15,
      scoringMode: "discrete",
      promptSpec: `Pillar: JOURNEY -- clarity + ownership. What to look for: do BOTH the coach and client leave with specific, time-bound, measurable commitments, with verbal ownership (not just instructions given)?

Buckets:
- 15 Elite: coach states their own commitment out loud with a deadline, client commitment is specific with a deadline, client owns a weekly theme in their own words, coach creates a micro-commitment if the client is slipping, both sides know exactly what's expected.
- 10 Strong: clear commitments but lacking specific deadlines or measurability, one side more accountable than the other, client commitment present but vague.
- 5 Mid: vague action steps ("do your workouts", "let me know how it goes"), no deadline, no specific task, no verbal ownership.
- 0 Fail: no clear next steps for either party.

Auto-cap: no concrete accountability commitment the client owns before close -- no specific, verifiable deliverable the client confirms -- caps this dimension at 10. A single named anchor task, OR a progression-gated ask (e.g. "send me your X video(s) before I progress you", client confirms) both satisfy this and do NOT trigger the cap, even if several items are listed.`
    },
    {
      id: "d7",
      name: "Accountability Anchor",
      max: 5,
      scoringMode: "discrete",
      promptSpec: `Pillar: JOURNEY -- single-point focus. What to look for: is there a clear, non-negotiable accountability commitment the client owns for the week, gated to a coach action (program progression, feedback)?

Best as ONE named anchor task, but a specific, verifiable, progression-gated deliverable the client confirms also qualifies -- even when several items are requested -- provided it's clear what the client owns and what it unlocks. Time-bound is satisfied by a hard date OR a session-relative deadline ("before our next call", "over the next two weeks before I progress you").

Buckets:
- 5 Elite: a clear commitment the client owns and verbally confirms, gated to the coach's next action -- a real chain of consequence. Either (a) one explicitly-named anchor, or (b) a specific verifiable deliverable required before the coach progresses, even if several items are listed, as long as it's clearly confirmed.
- 3 Mid: accountability gestured at but NOT clearly gated to a coach action/consequence -- tasks listed with equal weight and no clear "what this unlocks". Multiple tasks alone is NOT automatically a downgrade -- only downgrade if the gating/consequence is genuinely unclear.
- 0 Fail: no accountability anchor at all, or vague tasks with no consequence.

Calibration (do not deviate): "I want you to send me some videos over the next two weeks... I need to see these before I progress you," with the client confirming ("Absolutely"), is a satisfied Elite-tier accountability anchor even though several videos are listed and the deadline is a window rather than a single date. Do NOT downgrade purely because it's framed as a set of items or a session-relative deadline.`
    },
    {
      id: "d8",
      name: "Struggle Handling",
      max: 5,
      scoringMode: "discrete",
      promptSpec: `Pillar: CONNECTION + CONFIDENCE. What to look for: when the client reveals difficulty (physical, emotional, motivational, or frustration with the program), does the coach actually coach through it, or just acknowledge it?

Buckets:
- 5 Elite: coach does NOT defend, prove, or take it personally; stays grounded and fact-based; asks questions to get to the core before offering solutions; reconnects to the client's why; reframes ("we do not stop, we shift"); goes full circle; offers options. Client leaves feeling more capable and reconnected, not just heard.
- 3 Mid: acknowledges struggle and offers some support, asks some questions but doesn't fully coach through or reconnect to why, brief/surface reassurance.
- 0 Fail: struggle ignored, minimized, avoided, or coach becomes defensive.

Scoring note: if NO struggle is present anywhere in this call, score 5/5 by default -- do not penalize a smooth call for lacking an opportunity to demonstrate this.

Auto-cap: client struggle present but ignored, minimized, avoided, or coach becomes defensive -> forces this dimension to 0/5, non-recoverable.`
    },
    {
      id: "d9",
      name: "Close Quality",
      max: 5,
      scoringMode: "discrete",
      promptSpec: `Pillar: CONFIDENCE. What to look for: does the call end with emotional energy, specific celebration, and directional clarity -- or just logistics?

Buckets:
- 5 Elite: celebrates a specific, NAMED progress from THIS call, reiterates direction toward the next milestone, warm and earned close, client leaves energized not just satisfied.
- 3 Mid: positive close with some specificity but generic celebration ("you're doing great") or a flat close without direction, client leaves satisfied but not energized.
- 0 Fail: abrupt end, client leaves without emotional reinforcement or directional clarity.

Note: a written post-call breakdown sent separately (e.g. via Slack) is a post-call extension, not a substitute -- the in-call close must still land on its own.`
    },
    {
      id: "d10",
      name: "Next Call Booking",
      max: 5,
      scoringMode: "discrete",
      promptSpec: `Pillar: CONTINUITY. Non-negotiable. What to look for: is the next call booked LIVE before the call ends?

Buckets:
- 5 Elite: booked live on the call, booking link shared live or client books during the call, date confirmed verbally ("I see you booked for ___, we're locked in"), happens before the close.
- 0 Fail: not booked. Call ends without the next call locked in live. Automatic 0, non-recoverable -- no partial credit for "I'll send you the link" or "message me when you're free."

Auto-cap: next call NOT booked live during the call -> forces this dimension to 0/5, non-recoverable, regardless of how the rest of the call went.`
    },
    {
      id: "d11",
      name: "Continuity & Follow-Up Clarity",
      max: 5,
      scoringMode: "discrete",
      promptSpec: `Pillar: CONTINUITY. What to look for: does the client know EXACTLY what happens after this call ends -- what the coach will do, when, and how?

Scope note: scored ONLY on the in-call statement of the coach's own follow-up commitment. Whether the coach actually delivered it afterward cannot be verified from the transcript and is out of scope -- score only the presence and specificity of the in-call promise.

Buckets:
- 5 Elite: coach restates the accountability anchor explicitly, states their own follow-up with specific timing ("once you send X, I'll get you feedback by Y"), client could answer "what happens next?" without hesitation, chain is clear: client does X by Y, coach delivers Z by W.
- 3 Mid: follow-up mentioned but vague timing ("I'll send you feedback this week"), anchor partially restated, client unsure exactly what to expect.
- 0 Fail: no post-call structure stated, call ends with zero continuity visible.`
    },
    {
      id: "d12",
      name: "Structure & Time Management",
      max: 5,
      scoringMode: "discrete",
      promptSpec: `Pillar: FLOW. Target call length: 25-30 minutes. What to look for: did the call feel intentional and controlled, or scattered/rushed/bloated?

Buckets:
- 5 Elite: flows naturally through all applicable sections, pacing smooth, close and booking don't feel rushed, client never confused about where the call is going, the framework is woven in rather than announced.
- 3 Mid: slightly uneven pacing, most sections covered, one section rushed or bloated (or a key section compressed to under 30 seconds).
- 0 Fail: disorganized, core sections missing, flow unclear.

Calibration (do not deviate): robotic section announcements ("okay, now I'm in the check-in section") are a MID signal, not an Elite one -- naturalness is what's being scored, not checklist completeness.`
    }
  ]
};
