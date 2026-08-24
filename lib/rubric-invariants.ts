import type { RubricSpec, ModelDimensionResult } from "./rubrics/types";

export interface RubricInvariantIssue {
  code: string;
  message: string;
  dimensionId?: string;
}

export class RubricInvariantError extends Error {
  readonly issues: RubricInvariantIssue[];

  constructor(issues: RubricInvariantIssue[]) {
    super(`Rubric invariant validation failed: ${issues.map((issue) => issue.message).join("; ")}`);
    this.name = "RubricInvariantError";
    this.issues = issues;
  }
}

type ValidatableDimension = Pick<ModelDimensionResult, "id" | "score" | "band" | "disabled" | "disabledReason">;

type ValidatableReport = {
  dimensions: ValidatableDimension[];
};

export function validateRubricInvariants(rubric: RubricSpec, report: ValidatableReport): void {
  const issues: RubricInvariantIssue[] = [];
  const specsById = new Map(rubric.dimensions.map((dimension) => [dimension.id, dimension]));
  const seen = new Set<string>();

  for (const dimension of report.dimensions) {
    const spec = specsById.get(dimension.id);
    if (!spec) {
      issues.push({ code: "unexpected_dimension", dimensionId: dimension.id, message: `Unexpected dimension ID "${dimension.id}".` });
      continue;
    }
    if (seen.has(dimension.id)) {
      issues.push({ code: "duplicate_dimension", dimensionId: dimension.id, message: `Dimension "${dimension.id}" was returned more than once.` });
      continue;
    }
    seen.add(dimension.id);

    if (!Number.isFinite(dimension.score) || dimension.score < 0) {
      issues.push({ code: "score_below_zero", dimensionId: dimension.id, message: `Dimension "${dimension.id}" has a score below 0.` });
    }
    if (dimension.score > spec.max) {
      issues.push({ code: "score_above_maximum", dimensionId: dimension.id, message: `Dimension "${dimension.id}" has score ${dimension.score}, above its maximum of ${spec.max}.` });
    }

    if (dimension.disabled) {
      if (!spec.optional) {
        issues.push({ code: "required_dimension_disabled", dimensionId: dimension.id, message: `Required dimension "${dimension.id}" cannot be disabled.` });
      }
      if (dimension.score !== 0) {
        issues.push({ code: "disabled_nonzero_score", dimensionId: dimension.id, message: `Disabled dimension "${dimension.id}" must have score 0.` });
      }
      if (dimension.band !== "N/A") {
        issues.push({ code: "disabled_not_na", dimensionId: dimension.id, message: `Disabled dimension "${dimension.id}" must use band N/A.` });
      }
      if (!dimension.disabledReason || dimension.disabledReason.trim().length === 0) {
        issues.push({ code: "disabled_missing_reason", dimensionId: dimension.id, message: `Disabled dimension "${dimension.id}" must have an explicit disabled reason.` });
      }
      continue;
    }

    if (dimension.band === "N/A") {
      issues.push({ code: "enabled_na", dimensionId: dimension.id, message: `Enabled dimension "${dimension.id}" cannot use band N/A.` });
    }
    const rule = spec.scoreRules.find((candidate) => candidate.band === dimension.band);
    if (!rule) {
      issues.push({ code: "unknown_band", dimensionId: dimension.id, message: `Dimension "${dimension.id}" has band "${dimension.band}", which is not defined by the rubric.` });
    } else if (!isLegalScore(rule, dimension.score)) {
      issues.push({ code: "illegal_score_for_band", dimensionId: dimension.id, message: `Dimension "${dimension.id}" score ${dimension.score} is not legal for band "${dimension.band}".` });
    }
  }

  for (const spec of rubric.dimensions) {
    if (!seen.has(spec.id)) {
      issues.push({ code: "missing_dimension", dimensionId: spec.id, message: `Required dimension "${spec.id}" is missing.` });
    }
  }

  if (issues.length > 0) throw new RubricInvariantError(issues);
}

function isLegalScore(rule: { scores?: number[]; min?: number; max?: number; step?: number }, score: number): boolean {
  if (rule.scores?.includes(score)) return true;
  if (rule.min === undefined || rule.max === undefined || score < rule.min || score > rule.max) return false;
  const step = rule.step ?? 1;
  const steps = (score - rule.min) / step;
  return Math.abs(steps - Math.round(steps)) < Number.EPSILON * 10;
}