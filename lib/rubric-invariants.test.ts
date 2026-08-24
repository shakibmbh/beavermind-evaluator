import { describe, expect, it } from "vitest";
import { applyCapsAndScore, applyComputedCapOverrides } from "./scoring";
import { RubricInvariantError, validateRubricCapInvariants, validateRubricInvariants } from "./rubric-invariants";
import type { CapResult, ModelScoredReport, RubricSpec } from "./rubrics/types";
import { kickoffRubric } from "./rubrics/kickoff";
import { coachingRubric } from "./rubrics/coaching";

function validReport(rubric: RubricSpec): ModelScoredReport {
  return {
    dimensions: rubric.dimensions.map((spec) => {
      const rule = spec.scoreRules[0];
      const score = (rule.scores?.[0] ?? rule.min ?? 0) as number;
      return {
        id: spec.id,
        name: spec.name,
        max: spec.max,
        score,
        band: rule.band,
        disabled: false,
        disabledReason: null,
        reasoning: "Supported by the transcript.",
        quoteLineIds: [],
        keyEvidenceLineIds: [],
        quotes: [],
        keyEvidence: [],
        quickFix: "Keep the coach centered on the client’s next commitment."
      };
    }),
    caps: rubric.caps.map((spec) => ({ id: spec.id, label: spec.label, triggered: false, note: "Not triggered." })),
    oneThing: { change: "Improve the highest-leverage moment.", projectedScore: 100 },
    brief: "The coach delivered the call.",
    redFlags: [],
    coachSpeakerName: "Coach"
  };
}

function capResults(rubric: RubricSpec, triggeredIds: string[] = []): CapResult[] {
  return rubric.caps.map((spec) => ({
    id: spec.id,
    label: spec.label,
    triggered: triggeredIds.includes(spec.id),
    note: triggeredIds.includes(spec.id) ? "Triggered." : "Not triggered."
  }));
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

function expectCapInvariantFailure(rubric: RubricSpec, caps: CapResult[], code: string) {
  try {
    validateRubricCapInvariants(rubric, caps);
    throw new Error("Expected cap invariant validation to fail.");
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

  it("accepts every rubric cap exactly once", () => {
    expect(() => validateRubricCapInvariants(kickoffRubric, capResults(kickoffRubric))).not.toThrow();
    expect(() => validateRubricCapInvariants(coachingRubric, capResults(coachingRubric))).not.toThrow();
  });

  it("rejects a missing cap", () => {
    const caps = capResults(kickoffRubric);
    caps.pop();
    expectCapInvariantFailure(kickoffRubric, caps, "missing_cap");
  });

  it("rejects a duplicate cap", () => {
    const caps = capResults(kickoffRubric);
    caps.push({ ...caps[0] });
    expectCapInvariantFailure(kickoffRubric, caps, "duplicate_cap");
  });

  it("rejects an unknown cap", () => {
    const caps = capResults(kickoffRubric);
    caps[0] = { ...caps[0], id: "unknown_cap" };
    expectCapInvariantFailure(kickoffRubric, caps, "unexpected_cap");
  });

  it("computes an objectively triggered talk-share cap", () => {
    const caps = capResults(kickoffRubric).filter((cap) => cap.id !== "coach_talks_over_70pct");
    const computed = applyComputedCapOverrides(kickoffRubric, caps, {
      coachName: "Coach",
      clientName: "Client",
      coachWordShare: 71,
      totalTurns: 2
    });
    expect(computed.find((cap) => cap.id === "coach_talks_over_70pct")).toMatchObject({ triggered: true });
  });

  it("computes an objectively untriggered talk-share cap", () => {
    const computed = applyComputedCapOverrides(kickoffRubric, capResults(kickoffRubric), {
      coachName: "Coach",
      clientName: "Client",
      coachWordShare: 70,
      totalTurns: 2
    });
    expect(computed.find((cap) => cap.id === "coach_talks_over_70pct")).toMatchObject({ triggered: false });
  });

  it("applies multiple simultaneous caps deterministically", () => {
    const report = validReport(kickoffRubric);
    report.caps = capResults(kickoffRubric, ["no_followup_questions", "unresolved_confusion", "no_north_star"]);
    const scored = applyCapsAndScore(kickoffRubric, report);
    expect(scored.totalScore).toBe(70);
    expect(scored.dimensions.find((dimension) => dimension.id === "d4")?.score).toBe(10);
  });

  it("rejects an LLM response that omits a semantic cap", () => {
    const caps = capResults(kickoffRubric).filter((cap) => cap.id !== "no_followup_questions");
    try {
      applyComputedCapOverrides(kickoffRubric, caps, {
        coachName: "Coach",
        clientName: "Client",
        coachWordShare: 20,
        totalTurns: 2
      });
      throw new Error("Expected missing cap validation to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(RubricInvariantError);
      expect((error as RubricInvariantError).issues.map((issue) => issue.code)).toContain("missing_cap");
    }
  });

  it("reconstructs an omitted triggered objective cap instead of treating it as false", () => {
    const caps = capResults(kickoffRubric).filter((cap) => cap.id !== "coach_talks_over_70pct");
    const computed = applyComputedCapOverrides(kickoffRubric, caps, {
      coachName: "Coach",
      clientName: "Client",
      coachWordShare: 80,
      totalTurns: 2
    });
    const report = validReport(kickoffRubric);
    report.caps = computed;
    expect(applyCapsAndScore(kickoffRubric, report).totalScore).toBe(80);
  });

  it("calculates the deterministic total independently of the LLM projected score", () => {
    const report = validReport(kickoffRubric);
    report.oneThing.projectedScore = 1;
    const scored = applyCapsAndScore(kickoffRubric, report);
    expect(scored.totalScore).not.toBe(report.oneThing.projectedScore);
    expect(scored.totalScore).toBe(97);
  });
});
