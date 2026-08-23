import type { TalkTimeResult } from "./talk-time";
import type { RubricSpec, ModelScoredReport, ScoredReport, CapResult, AppliedCap } from "./rubrics/types";

function gradeBandFor(totalScore: number): string {
  if (totalScore >= 90) return "Elite";
  if (totalScore >= 80) return "Strong";
  if (totalScore >= 70) return "Inconsistent";
  if (totalScore >= 60) return "At Risk";
  return "Fail";
}

export function applyComputedCapOverrides(
  rubric: RubricSpec,
  caps: CapResult[],
  talkTime: TalkTimeResult
): CapResult[] {
  const computedCapSpecs = rubric.caps.filter((c) => c.computedBy === "coachTalkShare");
  if (computedCapSpecs.length === 0) return caps;

  const capById = new Map(caps.map((c) => [c.id, c]));

  for (const spec of computedCapSpecs) {
    const threshold = spec.talkShareThresholdPct ?? 100;
    const triggered = talkTime.coachWordShare > threshold;
    const note = `Computed directly from the transcript: ${talkTime.coachName} accounts for ${talkTime.coachWordShare.toFixed(1)}% of total words across the call (threshold: ${threshold}%).`;

    const existing = capById.get(spec.id);
    const overridden: CapResult = { id: spec.id, label: spec.label, triggered, note };
    if (existing) {
      Object.assign(existing, overridden);
    } else {
      caps.push(overridden);
    }
  }

  return caps;
}

/**
 * Takes the model's raw scoring output (already quote-verified) and applies
 * every automatic cap deterministically, in code -- not by trusting the
 * model's arithmetic. Dimension-level caps clamp that dimension's score
 * before summing; total-level caps clamp the summed/rescaled total after.
 *
 * Also computes the rescaled /100 total. The coaching rubric's own
 * dimension point values sum to 105 (not the 100 the document states),
 * and drop to 90 -- not the document's stated 85 -- when Dimension 4 is
 * disabled. Rather than silently "fixing" the client's document, we treat
 * `rawMax` as the literal sum of active dimensions' max points and always
 * rescale earned/available to a clean /100 -- which is consistent with the
 * rubric's own instruction to "report the result on the 100 scale" when D4
 * is off, generalized to handle the D2 case the same way.
 */
export function applyCapsAndScore(
  rubric: RubricSpec,
  modelReport: ModelScoredReport
): Omit<ScoredReport, "callType" | "unverifiedQuoteCount" | "coachName" | "clientName" | "scoredAt"> {
  const dimensionById = new Map(modelReport.dimensions.map((d) => [d.id, d]));
  const capById = new Map(rubric.caps.map((c) => [c.id, c]));

  // 1. Apply dimension-level caps (clamps + non-recoverable forced zeros),
  // tracking whether each triggered cap actually reduced the score.
  const dimensionCapBinding = new Map<string, boolean>();
  const dimensions = modelReport.dimensions.map((dim) => {
    const preClampScore = dim.disabled ? 0 : dim.score;
    let score = preClampScore;

    for (const capResult of modelReport.caps) {
      if (!capResult.triggered) continue;
      const spec = capById.get(capResult.id);
      if (!spec || spec.scope !== "dimension" || spec.targetDimensionId !== dim.id) continue;
      if (typeof spec.clamp === "number") {
        dimensionCapBinding.set(capResult.id, score > spec.clamp);
        score = Math.min(score, spec.clamp);
      }
    }

    const dimSpec = rubric.dimensions.find((d) => d.id === dim.id);
    const max = dimSpec?.max ?? 0;
    score = Math.max(0, Math.min(score, dim.disabled ? 0 : max));

    return { ...dim, score };
  });

  // 2. Raw score / raw max, counting only active (non-disabled) dimensions.
  const rawScore = dimensions.reduce((sum, d) => sum + d.score, 0);
  const rawMax = rubric.dimensions.reduce((sum, dimSpec) => {
    const result = dimensionById.get(dimSpec.id);
    return result?.disabled ? sum : sum + dimSpec.max;
  }, 0);

  const uncappedTotal = rawMax > 0 ? Math.round((rawScore / rawMax) * 100) : 0;
  let totalScore = uncappedTotal;

  const totalCapBinding = new Map<string, boolean>();
  const triggeredCaps = modelReport.caps.filter((c) => c.triggered);
  for (const capResult of triggeredCaps) {
    const spec = capById.get(capResult.id);
    if (spec?.scope === "total" && typeof spec.totalCap === "number") {
      totalCapBinding.set(capResult.id, uncappedTotal > spec.totalCap);
      totalScore = Math.min(totalScore, spec.totalCap);
    }
  }
  totalScore = Math.max(0, Math.min(100, totalScore));

  const capsApplied: AppliedCap[] = triggeredCaps.map((c) => ({
    ...c,
    binding: dimensionCapBinding.get(c.id) ?? totalCapBinding.get(c.id) ?? false
  }));

  return {
    dimensions,
    caps: modelReport.caps,
    oneThing: modelReport.oneThing,
    brief: modelReport.brief,
    redFlags: modelReport.redFlags,
    coachSpeakerName: modelReport.coachSpeakerName,
    rawScore,
    rawMax,
    totalScore,
    gradeBand: gradeBandFor(totalScore),
    capsApplied
  };
}
