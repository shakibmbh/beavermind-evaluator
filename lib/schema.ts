import { z } from "zod";
import type { RubricSpec } from "./rubrics/types";

// ---- Gemini responseSchema (OpenAPI 3.0 subset, Gemini's dialect: UPPERCASE types) ----
// Built per-request from the rubric so the `id` enum and dimension count can
// never silently drift from the rubric data itself.
export function buildGeminiSchema(rubric: RubricSpec) {
  const dimensionIds = rubric.dimensions.map((d) => d.id);
  const capIds = rubric.caps.map((c) => c.id);

  return {
    type: "OBJECT",
    properties: {
      dimensions: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING", enum: dimensionIds },
            score: { type: "NUMBER" },
            band: { type: "STRING", enum: ["Elite", "Strong", "Mid", "Weak", "Fail", "N/A"] },
            disabled: { type: "BOOLEAN" },
            disabledReason: { type: "STRING" },
            reasoning: { type: "STRING" },
            quoteLineIds: { type: "ARRAY", items: { type: "INTEGER" } },
            quickFix: { type: "STRING" }
          },
          required: ["id", "score", "band", "disabled", "disabledReason", "reasoning", "quoteLineIds", "quickFix"],
          propertyOrdering: ["id", "score", "band", "disabled", "disabledReason", "reasoning", "quoteLineIds", "quickFix"]
        }
      },
      caps: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING", enum: capIds },
            label: { type: "STRING" },
            triggered: { type: "BOOLEAN" },
            note: { type: "STRING" }
          },
          required: ["id", "label", "triggered", "note"],
          propertyOrdering: ["id", "label", "triggered", "note"]
        }
      },
      oneThing: {
        type: "OBJECT",
        properties: {
          change: { type: "STRING" },
          projectedScore: { type: "NUMBER" }
        },
        required: ["change", "projectedScore"]
      },
      brief: { type: "STRING" },
      redFlags: { type: "ARRAY", items: { type: "STRING" } }
    },
    required: ["dimensions", "caps", "oneThing", "brief", "redFlags"],
    propertyOrdering: ["dimensions", "caps", "oneThing", "brief", "redFlags"]
  } as const;
}

// ---- zod validator, mirrors the schema above. Defense in depth: Gemini's
// structured output is reliable but not infallible, and we'd rather fail
// the run with a clear error than write a malformed report to a run URL
// someone is about to share with a colleague. ----
export const dimensionResultSchema = z.object({
  id: z.string(),
  score: z.number(),
  band: z.enum(["Elite", "Strong", "Mid", "Weak", "Fail", "N/A"]),
  disabled: z.boolean(),
  disabledReason: z.string().nullable().default(null),
  reasoning: z.string(),
  quoteLineIds: z.array(z.number().int()),
  quickFix: z.string()
});

export const capResultSchema = z.object({
  id: z.string(),
  label: z.string(),
  triggered: z.boolean(),
  note: z.string()
});

export const modelScoredReportSchema = z.object({
  dimensions: z.array(dimensionResultSchema),
  caps: z.array(capResultSchema),
  oneThing: z.object({
    change: z.string(),
    projectedScore: z.number()
  }),
  brief: z.string(),
  redFlags: z.array(z.string())
});
