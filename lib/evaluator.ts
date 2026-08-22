import { preprocessTranscript } from "./preprocessor";
import { buildPrompt } from "./prompt-builder";
import { evaluateWithGemini } from "./gemini";
import { applyRules } from "./rule-engine";
import { generateReport } from "./report-generator";
import { type Report } from "./schemas";

export async function runEvaluator(callType: "kickoff" | "coaching", transcript: string): Promise<Report> {
  const preprocessing = preprocessTranscript(transcript);
  const prompt = buildPrompt(callType, transcript, preprocessing);
  const rawEvaluation = await evaluateWithGemini(prompt);
  const ruleResult = applyRules(
    rawEvaluation.dimension_scores,
    preprocessing,
    callType,
    rawEvaluation.d4_disabled,
    rawEvaluation.d4_disabled_reason
  );
  return generateReport(ruleResult, rawEvaluation.evidence, callType);
}
