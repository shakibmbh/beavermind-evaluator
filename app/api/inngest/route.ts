import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { scoreRun } from "@/lib/functions/score-run";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [scoreRun]
});
