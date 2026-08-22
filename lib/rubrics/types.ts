export type CallType = "kickoff" | "coaching";
export type ScoringMode = "band" | "discrete";

export interface DimensionSpec {
  id: string; // "d1".."d12"
  name: string;
  max: number;
  scoringMode: ScoringMode;
  optional?: boolean; // e.g. coaching D4 (movement coaching), D2 (diagnostics)
  disableHint?: string; // condition text shown to the model for when to disable
  /** Full band/bucket criteria, signals, and calibration notes, given to the model verbatim. */
  promptSpec: string;
}

export interface CapSpec {
  id: string;
  label: string; // condition, shown to the model
  effect: string; // human-readable description of what firing does
  scope: "total" | "dimension";
  targetDimensionId?: string; // when scope === "dimension"
  clamp?: number; // e.g. cap D4 at 10, or force D10 to 0
  totalCap?: number; // e.g. max 70 total
}

export interface RubricSpec {
  callType: CallType;
  dimensions: DimensionSpec[];
  caps: CapSpec[];
  bandsReference: { label: string; range: string; description: string }[];
  scoringPrinciples: string[];
}

// ---- What the model itself returns per dimension (kept minimal on purpose:
// name/max are already known from the rubric, so we don't ask the model to
// echo them back and risk it inventing a slightly different value) ----
export interface ModelDimensionResult {
  id: string;
  score: number; // 0 when disabled
  band: string; // "Elite" | "Strong" | "Mid" | "Weak" | "Fail" | "N/A"
  disabled: boolean;
  disabledReason: string | null;
  reasoning: string;
  quotes: string[]; // verbatim transcript lines; empty array if not evidenced
  quickFix: string;
}

// ---- Same, with name/max merged in from the rubric spec. This is the
// shape used everywhere downstream: scoring, quote verification, the PDF,
// and the UI. ----
export interface DimensionResult extends ModelDimensionResult {
  name: string;
  max: number;
}

export interface CapResult {
  id: string;
  label: string;
  triggered: boolean;
  note: string;
}

// ---- What the model returns overall (before deterministic post-processing) ----
export interface ModelScoredReport {
  dimensions: DimensionResult[];
  caps: CapResult[];
  oneThing: { change: string; projectedScore: number };
  brief: string;
  redFlags: string[];
}

// ---- Final report after code applies caps + rescaling + quote verification ----
export interface ScoredReport extends ModelScoredReport {
  callType: CallType;
  rawScore: number;
  rawMax: number; // sum of active (non-disabled) dimension max points
  totalScore: number; // rescaled to /100
  gradeBand: string; // Elite / Strong / Inconsistent / At Risk / Fail
  capsApplied: CapResult[]; // subset of caps where triggered === true
  unverifiedQuoteCount: number; // quotes that failed the substring check
  scoredAt: string;
}
