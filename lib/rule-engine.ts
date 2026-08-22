import { type DimensionScore, type Cap, type PreprocessingResult } from "./schemas";

interface DimensionConfig {
  id: string;
  name: string;
  max: number;
  type: "band" | "discrete";
  values?: number[];
}

const KICKOFF_DIMS: DimensionConfig[] = [
  { id: "D1", name: "Pre-Call Preparation", max: 10, type: "band" },
  { id: "D2", name: "Rapport & Tone", max: 10, type: "discrete", values: [10,7,3,0] },
  { id: "D3", name: "Agenda Framing", max: 5, type: "band" },
  { id: "D4", name: "Goal Alignment & Deep Why", max: 15, type: "discrete", values: [15,10,5,0] },
  { id: "D5", name: "Program Explanation", max: 10, type: "band" },
  { id: "D6", name: "Journey & Expectation Setting", max: 10, type: "discrete", values: [10,7,3,0] },
  { id: "D7", name: "Support System Clarity", max: 5, type: "discrete", values: [5,3,0] },
  { id: "D8", name: "Coaching Intelligence Questions", max: 10, type: "discrete", values: [10,7,3,0] },
  { id: "D9", name: "Next Steps & Diagnostics", max: 10, type: "discrete", values: [10,7,3,0] },
  { id: "D10", name: "Booking Next Call", max: 5, type: "band" },
  { id: "D11", name: "Close, Recap & Confidence", max: 5, type: "discrete", values: [5,3,0] },
  { id: "D12", name: "Post-Call Execution", max: 5, type: "band" },
];

const COACHING_DIMS: DimensionConfig[] = [
  { id: "D1", name: "Check-In & Connection", max: 10, type: "discrete", values: [10,7,3,0] },
  { id: "D2", name: "Diagnostics Review", max: 10, type: "discrete", values: [10,7,3,0] },
  { id: "D3", name: "Program Focus + Vision", max: 15, type: "discrete", values: [15,10,5,0] },
  { id: "D4", name: "Movement Coaching Quality", max: 15, type: "discrete", values: [15,10,5,0] },
  { id: "D5", name: "Adjustments & Strategy", max: 10, type: "discrete", values: [10,7,3,0] },
  { id: "D6", name: "Action Steps & Accountability", max: 15, type: "discrete", values: [15,10,5,0] },
  { id: "D7", name: "Accountability Anchor", max: 5, type: "discrete", values: [5,3,0] },
  { id: "D8", name: "Struggle Handling", max: 5, type: "discrete", values: [5,3,0] },
  { id: "D9", name: "Close Quality", max: 5, type: "discrete", values: [5,3,0] },
  { id: "D10", name: "Next Call Booking", max: 5, type: "discrete", values: [5,0] },
  { id: "D11", name: "Continuity & Follow-Up Clarity", max: 5, type: "discrete", values: [5,3,0] },
  { id: "D12", name: "Structure & Time Management", max: 5, type: "discrete", values: [5,3,0] },
];

function snap(score: number, config: DimensionConfig): number {
  if (config.type === "discrete" && config.values) {
    return config.values.reduce((prev, curr) =>
      Math.abs(curr - score) < Math.abs(prev - score) ? curr : prev
    );
  }
  return Math.max(0, Math.min(config.max, score));
}

export interface RuleEngineResult {
  dimensions: DimensionScore[];
  caps: Cap[];
  rawScore: number;
  maxPossible: number;
  normalizedScore: number;
  finalScore: number;
  grade: string;
}

export function applyRules(
  rawScores: { id: string; score: number; band: string; reasoning: string; evidence_refs: number[]; quick_fix: string }[],
  preprocessing: PreprocessingResult,
  callType: "kickoff" | "coaching",
  d4Disabled: boolean,
  d4DisabledReason: string | null
): RuleEngineResult {
  const configs = callType === "kickoff" ? KICKOFF_DIMS : COACHING_DIMS;
  const dimensions: DimensionScore[] = [];
  const caps: Cap[] = [];

  for (const config of configs) {
    const raw = rawScores.find((r) => r.id === config.id);
    let score = raw ? snap(raw.score, config) : 0;
    let band = raw ? raw.band : "Fail";
    let reasoning = raw ? raw.reasoning : "No evaluation provided.";
    let evidence_refs = raw ? raw.evidence_refs : [];
    let quick_fix = raw ? raw.quick_fix : "";
    let disabled = false;
    let disabledReason: string | undefined;
    let capped = false;
    let cappedReason: string | undefined;

    if (callType === "coaching" && config.id === "D4" && d4Disabled) {
      disabled = true;
      disabledReason = d4DisabledReason || "No movement coaching occurred on this call.";
      score = 0;
      band = "N/A";
    }

    dimensions.push({
      id: config.id, name: config.name,
      score: disabled ? null : score,
      max_score: config.max, band: disabled ? "N/A" : band,
      reasoning, evidence_refs, quick_fix,
      disabled, disabled_reason: disabledReason,
      capped, capped_reason: cappedReason,
    });
  }

  if (callType === "kickoff") {
    if (!preprocessing.has_follow_up_questions) {
      caps.push({ condition: "No follow-up questions anywhere in the call", applies: true, reason: "No follow-up questions detected", max_total: 70 });
    }
    if (preprocessing.coach_percentage > 70) {
      caps.push({ condition: "Coach speaks >70% of the time without client engagement", applies: true, reason: `Coach spoke ${preprocessing.coach_percentage.toFixed(1)}% of the time`, max_total: 80 });
    }
    if (preprocessing.has_unresolved_confusion) {
      caps.push({ condition: "Client shows unresolved confusion at any point", applies: true, reason: "Unresolved confusion detected", max_total: 75 });
    }
    if (!preprocessing.has_north_star) {
      const d4 = dimensions.find((d) => d.id === "D4");
      if (d4 && !d4.disabled && (d4.score || 0) > 10) {
        d4.score = 10; d4.capped = true; d4.capped_reason = "No North Star statement constructed";
        caps.push({ condition: "No North Star statement constructed", applies: true, reason: "No North Star detected", dimension_id: "D4", dimension_max: 10 });
      }
    }
    if (!preprocessing.has_structured_recap) {
      const d11 = dimensions.find((d) => d.id === "D11");
      if (d11 && !d11.disabled && (d11.score || 0) > 3) {
        d11.score = 3; d11.capped = true; d11.capped_reason = "No structured recap";
        caps.push({ condition: "No structured recap", applies: true, reason: "No structured recap detected", dimension_id: "D11", dimension_max: 3 });
      }
    }
  }

  if (callType === "coaching") {
    if (!preprocessing.has_live_booking) {
      const d10 = dimensions.find((d) => d.id === "D10");
      if (d10 && !d10.disabled) {
        d10.score = 0; d10.capped = true; d10.capped_reason = "Next call NOT booked live during the call — non-recoverable";
        caps.push({ condition: "Next call NOT booked live during the call", applies: true, reason: "No live booking detected", dimension_id: "D10", dimension_max: 0 });
      }
    }
    if (!preprocessing.has_long_term_vision) {
      const d3 = dimensions.find((d) => d.id === "D3");
      if (d3 && !d3.disabled && (d3.score || 0) > 10) {
        d3.score = 10; d3.capped = true; d3.capped_reason = "No long-term vision connection";
        caps.push({ condition: "No long-term vision connection anywhere", applies: true, reason: "No long-term vision detected", dimension_id: "D3", dimension_max: 10 });
      }
    }
    if (preprocessing.coach_percentage > 75) {
      caps.push({ condition: "Coach speaks >75% of the call", applies: true, reason: `Coach spoke ${preprocessing.coach_percentage.toFixed(1)}% of the time`, max_total: 75 });
    }
    if (!preprocessing.has_concrete_accountability) {
      const d6 = dimensions.find((d) => d.id === "D6");
      if (d6 && !d6.disabled && (d6.score || 0) > 10) {
        d6.score = 10; d6.capped = true; d6.capped_reason = "No concrete accountability commitment the client owns";
        caps.push({ condition: "No concrete accountability commitment", applies: true, reason: "No concrete accountability detected", dimension_id: "D6", dimension_max: 10 });
      }
    }
    if (preprocessing.has_client_struggle && !preprocessing.struggle_addressed) {
      const d8 = dimensions.find((d) => d.id === "D8");
      if (d8 && !d8.disabled) {
        d8.score = 0; d8.capped = true; d8.capped_reason = "Client struggle present but ignored or avoided — non-recoverable";
        caps.push({ condition: "Client struggle present but ignored", applies: true, reason: "Struggle detected but not addressed", dimension_id: "D8", dimension_max: 0 });
      }
    }
    if (!preprocessing.has_action_steps) {
      caps.push({ condition: "No action steps stated for either party before close", applies: true, reason: "No action steps detected", max_total: 70 });
    }
  }

  const active = dimensions.filter((d) => !d.disabled);
  const rawScore = active.reduce((sum, d) => sum + (d.score || 0), 0);
  const maxPossible = active.reduce((sum, d) => sum + d.max_score, 0);
  const normalizedScore = maxPossible < 100 ? (rawScore / maxPossible) * 100 : rawScore;

  let finalScore = normalizedScore;
  for (const cap of caps) {
    if (cap.max_total && finalScore > cap.max_total) finalScore = cap.max_total;
  }

  const grade =
    finalScore >= 90 ? "Elite" :
    finalScore >= 80 ? "Strong" :
    finalScore >= 70 ? "Inconsistent" :
    finalScore >= 60 ? "At Risk" : "Fail";

  return { dimensions, caps, rawScore, maxPossible, normalizedScore, finalScore, grade };
}
