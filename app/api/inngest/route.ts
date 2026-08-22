import { serve } from "inngest/next";
import { inngest, evaluateTranscript } from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [evaluateTranscript],
});
