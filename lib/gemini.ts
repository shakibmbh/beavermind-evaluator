import type { RubricSpec } from "./rubrics/types";
import { buildGeminiSchema, modelScoredReportSchema } from "./schema";
import type { ModelScoredReport } from "./rubrics/types";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function buildPrompt(rubric: RubricSpec, transcript: string): string {
  const dimensionBlocks = rubric.dimensions
    .map((d) => {
      const optionalNote = d.optional ? `\n\nOPTIONAL DIMENSION: ${d.disableHint}` : "";
      return `## ${d.id.toUpperCase()} -- ${d.name} (max ${d.max} pts, ${d.scoringMode === "discrete" ? "discrete buckets, no interpolation" : "band-based, pick a point within the matched band"})\n${d.promptSpec}${optionalNote}`;
    })
    .join("\n\n");

  const capBlocks = rubric.caps
    .map((c) => {
      if (c.computedBy === "coachTalkShare") {
        return `- ${c.id}: "${c.label}" -> ${c.effect} (DO NOT evaluate this one yourself -- talk-time share is computed directly from the transcript text in code, not estimated by you. Still include an entry for this id with triggered: false and note: "computed separately" so the response is well-formed; it will be overridden.)`;
      }
      return `- ${c.id}: "${c.label}" -> ${c.effect}`;
    })
    .join("\n");

  return `You are scoring a single ${rubric.callType} call transcript against a fixed client rubric. You are not a lenient reviewer and you are not a harsh one -- you are a calibrated one. Follow the rubric exactly as written below. Do not use outside knowledge of coaching best practice that isn't in this rubric.

# Hard rules (violating any of these makes the report unusable)

1. EVIDENCE OR NOTHING. Every dimension's "quotes" array must contain only text that appears VERBATIM in the transcript below -- copy the exact wording of the speaking turn(s) you're relying on, character for character. If you cannot find a verbatim line supporting a behavior, the quotes array for that claim must be empty, and your reasoning must say the behavior was not evidenced in the transcript. Do not paraphrase into quotes. Do not invent or reconstruct plausible-sounding lines. Do not infer from the general mood or tone of the call -- score only what is explicitly said.
2. Never guess a coach's intent or a client's feelings beyond what they explicitly say or verbally confirm. "The client seemed happy" is not evidence; "client said 'I love this'" is.
3. Score every one of the 12 dimensions listed below, using their exact "id" field (e.g. "d1", "d4"). Do not add, skip, merge, or rename dimensions.
4. For each of the caps listed below, decide independently whether it is triggered by this specific transcript, and say why in "note" (a short sentence citing what you observed, or its absence). Do not apply the cap's numeric effect yourself -- just report whether it's triggered. The effect is applied deterministically afterward by code, not by you.
5. Where a dimension is explicitly optional (see below), only set disabled: true if the transcript clearly meets the stated disable condition. Otherwise score it normally and set disabled: false.
6. "quickFix" describes, in one or two sentences, the single concrete thing the coach would have needed to do differently DURING THIS CALL to reach full marks on that dimension specifically.

# Rubric: ${rubric.callType} call, 12 dimensions

${dimensionBlocks}

# Scoring principles

${rubric.scoringPrinciples.map((p) => `- ${p}`).join("\n")}

# Global automatic caps to evaluate (report triggered: true/false for each, do not apply the numeric effect yourself)

${capBlocks}

# Report-level fields to produce

- "oneThing": the single highest-leverage change to this specific call -- the one thing that would move the total score the most if fixed -- with "change" (what the coach should have done) and "projectedScore" (your best estimate of the total /100 score if that one change were made, holding everything else constant).
- "brief": 3-5 sentences on how the call went overall, written directly to the coach in a supportive-but-honest coaching voice, not a third-person summary.
- "redFlags": a list of specific things in this call that put the client at risk of leaving the program, even if the overall score looks fine. Each entry should name the specific moment or pattern, not a generic worry. If there are genuinely none, return an empty array -- do not invent a flag to fill the field.

# Transcript to score (${rubric.callType} call, ${transcript.length} characters, one line per speaking turn)

<transcript>
${transcript}
</transcript>

Now score this transcript. Return ONLY the JSON object matching the provided schema -- no prose before or after it.`;
}

export class GeminiScoringError extends Error {}

export async function scoreTranscriptWithGemini(
  rubric: RubricSpec,
  transcript: string
): Promise<ModelScoredReport> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiScoringError("Missing GEMINI_API_KEY environment variable.");
  }

  const prompt = buildPrompt(rubric, transcript);
  const schema = buildGeminiSchema(rubric);

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2
      }
    })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GeminiScoringError(`Gemini API request failed (${res.status}): ${body.slice(0, 500)}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    const finishReason = data?.candidates?.[0]?.finishReason ?? "unknown";
    throw new GeminiScoringError(`Gemini returned no content (finishReason: ${finishReason}).`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new GeminiScoringError("Gemini's response was not valid JSON despite the enforced schema.");
  }

  const validated = modelScoredReportSchema.safeParse(parsed);
  if (!validated.success) {
    throw new GeminiScoringError(
      `Gemini's response didn't match the expected shape: ${validated.error.issues.map((i) => i.message).join("; ")}`
    );
  }

  // Guard against a dimension being dropped despite the schema requiring all ids.
  const returnedIds = new Set(validated.data.dimensions.map((d) => d.id));
  const missing = rubric.dimensions.filter((d) => !returnedIds.has(d.id));
  if (missing.length > 0) {
    throw new GeminiScoringError(
      `Gemini's response is missing dimension(s): ${missing.map((d) => d.id).join(", ")}.`
    );
  }

  // Merge in name/max from the rubric spec rather than trusting the model
  // to echo them back correctly.
  const specById = new Map(rubric.dimensions.map((d) => [d.id, d]));
  const dimensions = validated.data.dimensions.map((d) => {
    const spec = specById.get(d.id)!;
    return { ...d, name: spec.name, max: spec.max };
  });

  return { ...validated.data, dimensions };
}
