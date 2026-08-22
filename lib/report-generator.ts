import { type Report, type RuleEngineResult, type Evidence } from "./schemas";

export function generateReport(
  ruleResult: RuleEngineResult,
  evidence: Evidence[],
  callType: "kickoff" | "coaching"
): Report {
  const { dimensions, caps, finalScore, maxPossible, normalizedScore, grade } = ruleResult;

  let oneThing = { dimension: "", description: "", current_score: 0, potential_score: 0, point_gain: 0, new_total: finalScore };

  for (const dim of dimensions) {
    if (dim.disabled) continue;
    const current = dim.score || 0;
    const potential = dim.max_score;
    const gain = potential - current;
    const hasCap = dim.capped && dim.capped_reason;
    const effectiveGain = hasCap ? 0 : gain;
    if (effectiveGain > oneThing.point_gain) {
      oneThing = { dimension: `${dim.id} — ${dim.name}`, description: dim.quick_fix, current_score: current, potential_score: potential, point_gain: effectiveGain, new_total: Math.min(100, finalScore + effectiveGain) };
    }
  }

  if (oneThing.point_gain === 0) {
    for (const dim of dimensions) {
      if (dim.disabled) continue;
      const current = dim.score || 0;
      const gain = dim.max_score - current;
      if (gain > oneThing.point_gain) {
        oneThing = { dimension: `${dim.id} — ${dim.name}`, description: dim.quick_fix, current_score: current, potential_score: dim.max_score, point_gain: gain, new_total: Math.min(100, finalScore + gain) };
      }
    }
  }

  return {
    one_thing: oneThing,
    brief: generateBrief(dimensions, grade, callType),
    red_flags: generateRedFlags(dimensions, caps, grade),
    grade,
    total_score: Math.round(finalScore * 10) / 10,
    max_possible: maxPossible,
    normalized_score: Math.round(normalizedScore * 10) / 10,
    dimensions,
    caps,
  };
}

function generateBrief(dimensions: Report["dimensions"], grade: string, callType: string): string {
  const typeLabel = callType === "kickoff" ? "kick-off" : "coaching";
  const strong = dimensions.filter((d) => !d.disabled && (d.score || 0) >= d.max_score * 0.8);
  const weak = dimensions.filter((d) => !d.disabled && (d.score || 0) <= d.max_score * 0.4);
  let brief = `This ${typeLabel} call scored ${grade.toLowerCase()} overall. `;
  if (strong.length >= 8) {
    brief += "The coach demonstrated strong fundamentals across most dimensions, with particularly solid work in " + strong.slice(0, 3).map((d) => d.name.toLowerCase()).join(", ") + ". ";
  } else if (weak.length >= 4) {
    brief += "Several core dimensions need attention. The biggest gaps are in " + weak.slice(0, 3).map((d) => d.name.toLowerCase()).join(", ") + ". ";
  } else {
    brief += "The call was inconsistent — strong in some areas but with clear gaps in others. ";
  }
  if (weak.length > 0) brief += `Focus on ${weak[0].name.toLowerCase()} first: ${weak[0].quick_fix}`;
  return brief;
}

function generateRedFlags(dimensions: Report["dimensions"], caps: Report["caps"], grade: string): string[] {
  const flags: string[] = [];
  for (const dim of dimensions) {
    if (dim.disabled) continue;
    if (dim.id === "D10" && (dim.score || 0) === 0) flags.push("Next call was not booked live — this breaks the accountability loop and is a direct churn risk.");
    if (dim.id === "D8" && (dim.score || 0) === 0) flags.push("Client struggle was present but not coached through — this is a non-recoverable retention risk.");
    if (dim.id === "D4" && (dim.score || 0) === 0 && !dim.disabled) flags.push("No goal alignment or deep 'why' extracted — clients without emotional anchors churn 3x faster.");
    if (dim.id === "D9" && (dim.score || 0) <= 3) flags.push("Vague or missing next steps — 'I\'ll send you stuff' is the most expensive sentence in coaching.");
  }
  for (const cap of caps) {
    if (cap.condition.includes("follow-up questions")) flags.push("No follow-up questions anywhere — the coach stayed surface-level, which limits client buy-in.");
    if (cap.condition.includes("Coach speaks")) flags.push("Coach dominated speaking time — client engagement is the strongest predictor of retention.");
    if (cap.condition.includes("confusion")) flags.push("Client left with unresolved confusion — they may disengage rather than ask for clarification.");
    if (cap.condition.includes("action steps")) flags.push("No clear action steps for either party — the hand-off is where most clients are lost.");
  }
  if (grade === "At Risk" || grade === "Fail") flags.push(`Overall ${grade.toLowerCase()} grade — client is likely questioning the investment. Immediate coaching intervention recommended.`);
  return flags.length > 0 ? flags : ["No critical red flags identified, but review dimension-level feedback for improvement opportunities."];
}
