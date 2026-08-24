import { describe, expect, it } from "vitest";
import { toRunResponse } from "./run-response";

describe("toRunResponse", () => {
  it("allowlists fields and sanitizes failed-run details", () => {
    const response = toRunResponse({
      id: "run-1",
      call_type: "kickoff",
      status: "failed",
      error_message: "database password and stack trace",
      result: null,
      pdf_url: null
    });

    expect(response).toEqual({
      id: "run-1",
      call_type: "kickoff",
      status: "failed",
      error_message: "This evaluation could not be completed. Please start a new evaluation.",
      result: null,
      pdf_url: null
    });
    expect(JSON.stringify(response)).not.toContain("password");
    expect(JSON.stringify(response)).not.toContain("stack trace");
  });
});