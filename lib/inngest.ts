import { Inngest } from "inngest";
import { supabase } from "./supabase";
import { runEvaluator } from "./evaluator";

export const inngest = new Inngest({ id: "beavermind-evaluator" });

export const evaluateTranscript = inngest.createFunction(
  { id: "evaluate-transcript", retries: 2, concurrency: { limit: 5 } },
  { event: "transcript.submitted" },
  async ({ event, step }) => {
    const { runId, callType, transcript } = event.data as {
      runId: string; callType: "kickoff" | "coaching"; transcript: string;
    };
    try {
      await step.run("evaluate", async () => {
        const report = await runEvaluator(callType, transcript);
        await supabase.from("runs").update({
          status: "done",
          result_json: report,
          caps_applied: report.caps.filter((c) => c.applies),
          completed_at: new Date().toISOString(),
        }).eq("id", runId);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error during evaluation";
      await supabase.from("runs").update({
        status: "failed",
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      }).eq("id", runId);
      throw error;
    }
  }
);
