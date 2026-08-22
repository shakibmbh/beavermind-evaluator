import { inngest } from "../inngest";
import { supabaseServer } from "../supabase/server";
import { getRubric } from "../rubrics";
import { scoreTranscriptWithGemini, GeminiScoringError } from "../gemini";
import { verifyQuotes } from "../verify-quotes";
import { applyCapsAndScore } from "../scoring";
import { renderReportPdf } from "../pdf";
import { uploadReportPdf } from "../storage";
import type { CallType } from "../rubrics/types";
import type { ScoredReport } from "../rubrics/types";

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Scoring failed after retries.";
}

export const scoreRun = inngest.createFunction(
  {
    id: "score-run",
    retries: 3,
    onFailure: async ({ event, error }) => {
      // Runs once all retries are exhausted -- this is what turns into the
      // human-readable "why" on a failed run.
      const runId = event?.data?.event?.data?.runId as string | undefined;
      if (!runId) return;
      const supabase = supabaseServer();
      await supabase
        .from("runs")
        .update({
          status: "failed",
          error_message: errorMessage(error)
        })
        .eq("id", runId);
    }
  },
  { event: "run/created" },
  async ({ event, step }) => {
    const { runId, callType, transcript } = event.data as {
      runId: string;
      callType: CallType;
      transcript: string;
    };

    const supabase = supabaseServer();
    const rubric = getRubric(callType);

    await step.run("mark-running", async () => {
      const { error } = await supabase.from("runs").update({ status: "running" }).eq("id", runId);
      if (error) throw new Error(`Failed to mark run as running: ${error.message}`);
    });

    const modelReport = await step.run("call-gemini", async () => {
      try {
        return await scoreTranscriptWithGemini(rubric, transcript);
      } catch (err) {
        // Re-throw as a plain Error so Inngest's retry + failure payload
        // carries a readable message instead of a swallowed class instance.
        if (err instanceof GeminiScoringError) throw new Error(err.message);
        throw err;
      }
    });

    const scoredReport: ScoredReport = await step.run("verify-and-score", async () => {
      const { report: verified, unverifiedQuoteCount } = verifyQuotes(modelReport, transcript);
      const scored = applyCapsAndScore(rubric, verified);
      return {
        ...scored,
        callType,
        unverifiedQuoteCount,
        scoredAt: new Date().toISOString()
      };
    });

    const pdfUrl = await step.run("generate-and-upload-pdf", async () => {
      const pdfBuffer = await renderReportPdf(scoredReport, callType);
      return uploadReportPdf(runId, pdfBuffer);
    });

    await step.run("mark-done", async () => {
      const { error } = await supabase
        .from("runs")
        .update({
          status: "done",
          result: scoredReport,
          pdf_url: pdfUrl
        })
        .eq("id", runId);
      if (error) throw new Error(`Failed to mark run as done: ${error.message}`);
    });

    return { runId, totalScore: scoredReport.totalScore };
  }
);
