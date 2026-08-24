import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const supabaseServer = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({ supabaseServer }));
vi.mock("@/lib/run-response", () => ({
  toRunResponse: (run: Record<string, unknown>) => ({
    id: run.id,
    call_type: run.call_type,
    status: run.status,
    error_message: run.status === "failed" ? "This evaluation could not be completed. Please start a new evaluation." : null,
    result: run.result,
    pdf_url: run.pdf_url
  })
}));

function makeSupabase(run: Record<string, unknown> | null, error: { message: string } | null = null) {
  const single = vi.fn().mockResolvedValue({ data: run, error });
  const query = {
    eq: vi.fn(() => ({ single }))
  };
  const from = vi.fn(() => ({
    select: vi.fn(() => query)
  }));
  return { client: { from }, from, select: from.mock.results[0]?.value?.select, single };
}

const runId = "123e4567-e89b-12d3-a456-426614174000";

describe("GET /api/runs/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only the client DTO and sanitizes failed-run details", async () => {
    const supabase = makeSupabase({
      id: runId,
      call_type: "kickoff",
      status: "failed",
      error_message: "database password and stack trace",
      result: null,
      pdf_url: null,
      transcript: "[Coach]: sensitive transcript",
      created_at: "2026-08-24T00:00:00.000Z",
      updated_at: "2026-08-24T00:00:01.000Z"
    });
    supabaseServer.mockReturnValue(supabase.client);

    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ id: runId }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      id: runId,
      call_type: "kickoff",
      status: "failed",
      error_message: "This evaluation could not be completed. Please start a new evaluation.",
      result: null,
      pdf_url: null
    });
    expect(JSON.stringify(body)).not.toContain("sensitive transcript");
    expect(JSON.stringify(body)).not.toContain("password");
    expect(JSON.stringify(body)).not.toContain("stack trace");
    expect(supabase.from).toHaveBeenCalledWith("runs");
  });

  it("preserves report fields for completed runs without exposing source fields", async () => {
    const supabase = makeSupabase({
      id: runId,
      call_type: "coaching",
      status: "done",
      error_message: null,
      result: { totalScore: 88 },
      pdf_url: "https://example.com/report.pdf",
      transcript: "[Coach]: private",
      created_at: "2026-08-24T00:00:00.000Z",
      updated_at: "2026-08-24T00:00:01.000Z"
    });
    supabaseServer.mockReturnValue(supabase.client);

    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ id: runId }) });
    const body = await response.json();

    expect(body).toEqual({
      id: runId,
      call_type: "coaching",
      status: "done",
      error_message: null,
      result: { totalScore: 88 },
      pdf_url: "https://example.com/report.pdf"
    });
    expect(body).not.toHaveProperty("transcript");
    expect(body).not.toHaveProperty("created_at");
    expect(body).not.toHaveProperty("updated_at");
  });
});