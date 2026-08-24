import { describe, expect, it } from "vitest";
import { applyCapsAndScore } from "./scoring";
import { RubricInvariantError, validateRubricInvariants } from "./rubric-invariants";
import type { ModelScoredReport, RubricSpec } from "./rubrics/types";
import { kickoffRubric } from "./rubrics/kickoff";
import { coachingRubric } from "./rubrics/coaching";

function validReport(rubric: RubricSpec): ModelScoredReport {
  return {
    dimensions: rubric.dimensions.map((spec) => {
      const rule = spec.scoreRules[0];
      return {
        id: spec.id,
        name: spec.name,
        max: spec.max,
        score: rule.scores?.[0] ?? rule.min,
        band: rule.band,
        disabled: false,
        disabledReason: null,
        reasoning: "Supported by the transcript.",
        quoteLineIds: [],
        quotes: []
      };
    }),
    caps: [],
    oneThing: { change: "Improve the highest-leverage moment.", projectedScore: 100 },
    brief: "The coach delivered the call.",
    redFlags: [],
    coachSpeakerName: "Coach"
  };
}

function expectInvariantFailure(report: ModelScoredReport, rubric: RubricSpec, code: string) {
  try {
    validateRubricInvariants(rubric, report);
    throw new Error("Expected invariant validation to fail.");
  } catch (error) {
    expect(error).toBeInstanceOf(RubricInvariantError);
    expect((error as RubricInvariantError).issues.map((issue) => issue.code)).toContain(code);
  }
}

describe("rubric invariant validation", () => {
  it("accepts a valid Kick-off evaluation", () => {
    expect(() => validateRubricInvariants(kickoffRubric, validReport(kickoffRubric))).not.toThrow();
  });

  it("accepts a valid Coaching evaluation", () => {
    expect(() => validateRubricInvariants(coachingRubric, validReport(coachingRubric))).not.toThrow();
  });

  it("rejects an invalid dimension ID", () => {
    const report = validReport(kickoffRubric);
    report.dimensions[0].id = "d99";
    expectInvariantFailure(report, kickoffRubric, "unexpected_dimension");
  });

  it("rejects a missing dimension", () => {
    const report = validReport(kickoffRubric);
    report.dimensions.pop();
    expectInvariantFailure(report, kickoffRubric, "missing_dimension");
  });

  it("rejects a score above maximum", () => {
    const report = validReport(kickoffRubric);
    report.dimensions[0].score = 11;
    expectInvariantFailure(report, kickoffRubric, "score_above_maximum");
  });

  it("rejects a negative score", () => {
    const report = validReport(kickoffRubric);
    report.dimensions[0].score = -1;
    expectInvariantFailure(report, kickoffRubric, "score_below_zero");
  });

  it("rejects an illegal discrete Coaching score", () => {
    const report = validReport(coachingRubric);
    report.dimensions[0].score = 8;
    expectInvariantFailure(report, coachingRubric, "illegal_score_for_band");
  });

  it("rejects a disabled dimension with a non-zero score", () => {
    const report = validReport(coachingRubric);
    const dimension = report.dimensions[1];
    dimension.disabled = true;
    dimension.band = "N/A";
    dimension.score = 3;
    dimension.disabledReason = "Not applicable.";
    expectInvariantFailure(report, coachingRubric, "disabled_nonzero_score");
  });

  it("rejects a disabled dimension without a reason", () => {
    const report = validReport(coachingRubric);
    const dimension = report.dimensions[1];
    dimension.disabled = true;
    dimension.band = "N/A";
    dimension.score = 0;
    dimension.disabledReason = null;
    expectInvariantFailure(report, coachingRubric, "disabled_missing_reason");
  });

  it("rejects disabling every required dimension", () => {
    for (const spec of [...kickoffRubric.dimensions, ...coachingRubric.dimensions].filter((dimension) => !dimension.optional)) {
      const rubric = spec.id === "d1" && coachingRubric.dimensions.includes(spec) ? coachingRubric : kickoffRubric;
      const report = validReport(rubric);
      const dimension = report.dimensions.find((candidate) => candidate.id === spec.id)!;
      dimension.disabled = true;
      dimension.band = "N/A";
      dimension.score = 0;
      dimension.disabledReason = "Not applicable.";

      expectInvariantFailure(report, rubric, "required_dimension_disabled");
    }
  });

  it("allows Coaching D2 and D4 to use the existing disabled representation", () => {
    const report = validReport(coachingRubric);
    for (const dimensionId of ["d2", "d4"]) {
      const dimension = report.dimensions.find((candidate) => candidate.id === dimensionId)!;
      dimension.disabled = true;
      dimension.band = "N/A";
      dimension.score = 0;
      dimension.disabledReason = "This call did not include the applicable review.";
    }

    expect(() => validateRubricInvariants(coachingRubric, report)).not.toThrow();
  });

  it("excludes disabled optional dimensions from normalization", () => {
    const report = validReport(coachingRubric);
    for (const dimensionId of ["d2", "d4"]) {
      const dimension = report.dimensions.find((candidate) => candidate.id === dimensionId)!;
      dimension.disabled = true;
      dimension.band = "N/A";
      dimension.score = 0;
      dimension.disabledReason = "This call did not include the applicable review.";
    }

    const scored = applyCapsAndScore(coachingRubric, report);
    expect(scored.rawScore).toBe(80);
    expect(scored.rawMax).toBe(80);
    expect(scored.totalScore).toBe(100);
  });

  it("cannot inflate the score by disabling a required dimension", () => {
    const report = validReport(coachingRubric);
    const dimension = report.dimensions.find((candidate) => candidate.id === "d1")!;
    dimension.disabled = true;
    dimension.band = "N/A";
    dimension.score = 0;
    dimension.disabledReason = "Not applicable.";

    expect(() => applyCapsAndScore(coachingRubric, report)).toThrow(RubricInvariantError);
  });

  it("rejects an enabled dimension marked N/A", () => {
    const report = validReport(coachingRubric);
    report.dimensions[0].band = "N/A";
    expectInvariantFailure(report, coachingRubric, "enabled_na");
  });

  it("rejects duplicate dimension IDs", () => {
    const report = validReport(kickoffRubric);
    report.dimensions[1].id = report.dimensions[0].id;
    expectInvariantFailure(report, kickoffRubric, "duplicate_dimension");
  });

  it("calculates the deterministic total independently of the LLM projected score", () => {
    const report = validReport(kickoffRubric);
    report.oneThing.projectedScore = 1;
    const scored = applyCapsAndScore(kickoffRubric, report);
    expect(scored.totalScore).not.toBe(report.oneThing.projectedScore);
    expect(scored.totalScore).toBe(97);
  });
});
