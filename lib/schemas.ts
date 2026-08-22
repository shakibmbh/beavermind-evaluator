import { z } from "zod";

export const EvidenceSchema = z.object({
  dimension_id: z.string(),
  criterion: z.string(),
  speaker: z.string(),
  verbatim: z.string(),
  interpretation: z.string(),
  impact: z.enum(["positive", "negative", "neutral"]),
});

export const DimensionScoreSchema = z.object({
  id: z.string(),
  name: z.string(),
  score: z.number().nullable(),
  max_score: z.number(),
  band: z.string(),
  reasoning: z.string(),
  evidence_refs: z.array(z.number()),
  quick_fix: z.string(),
  disabled: z.boolean().optional(),
  disabled_reason: z.string().optional(),
  capped: z.boolean().optional(),
  capped_reason: z.string().optional(),
});

export const CapSchema = z.object({
  condition: z.string(),
  applies: z.boolean(),
  reason: z.string(),
  max_total: z.number().optional(),
  dimension_id: z.string().optional(),
  dimension_max: z.number().optional(),
});

export const RawEvaluationSchema = z.object({
  evidence: z.array(EvidenceSchema),
  dimension_scores: z.array(
    z.object({
      id: z.string(),
      score: z.number(),
      band: z.string(),
      reasoning: z.string(),
      evidence_refs: z.array(z.number()),
      quick_fix: z.string(),
    })
  ),
  caps_identified: z.array(CapSchema),
  d4_disabled: z.boolean(),
  d4_disabled_reason: z.string().nullable(),
  preprocessing_notes: z.object({
    coach_word_count: z.number(),
    client_word_count: z.number(),
    coach_percentage: z.number(),
    has_follow_up_questions: z.boolean(),
    has_north_star: z.boolean(),
    has_structured_recap: z.boolean(),
    has_live_booking: z.boolean(),
    has_long_term_vision: z.boolean(),
    has_concrete_accountability: z.boolean(),
    has_client_struggle: z.boolean(),
    has_action_steps: z.boolean(),
    has_movement_coaching: z.boolean(),
    has_unresolved_confusion: z.boolean(),
    struggle_addressed: z.boolean(),
  }),
});

export const ReportSchema = z.object({
  one_thing: z.object({
    dimension: z.string(),
    description: z.string(),
    current_score: z.number(),
    potential_score: z.number(),
    point_gain: z.number(),
    new_total: z.number(),
  }),
  brief: z.string(),
  red_flags: z.array(z.string()),
  grade: z.string(),
  total_score: z.number(),
  max_possible: z.number(),
  normalized_score: z.number(),
  dimensions: z.array(DimensionScoreSchema),
  caps: z.array(CapSchema),
});

export type Evidence = z.infer<typeof EvidenceSchema>;
export type DimensionScore = z.infer<typeof DimensionScoreSchema>;
export type Cap = z.infer<typeof CapSchema>;
export type RawEvaluation = z.infer<typeof RawEvaluationSchema>;
export type Report = z.infer<typeof ReportSchema>;
