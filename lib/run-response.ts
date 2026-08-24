import type { RunRow } from "./supabase/types";

export type RunResponse = Pick<RunRow, "id" | "call_type" | "status" | "error_message" | "result" | "pdf_url">;

const SAFE_FAILURE_MESSAGE = "This evaluation could not be completed. Please start a new evaluation.";

export function toRunResponse(run: RunResponse): RunResponse {
  return {
    id: run.id,
    call_type: run.call_type,
    status: run.status,
    error_message: run.status === "failed" ? SAFE_FAILURE_MESSAGE : null,
    result: run.result,
    pdf_url: run.pdf_url
  };
}