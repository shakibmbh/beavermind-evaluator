import type { CallType, RubricSpec } from "./types";
import { kickoffRubric } from "./kickoff";
import { coachingRubric } from "./coaching";

export const rubrics: Record<CallType, RubricSpec> = {
  kickoff: kickoffRubric,
  coaching: coachingRubric
};

export function getRubric(callType: CallType): RubricSpec {
  return rubrics[callType];
}

export * from "./types";
