import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST, markDispatchFailure } from "./route";

const { send, supabaseServer } = vi.hoisted(() => ({
  send: vi.fn(),
  supabaseServer: vi.fn()
}));

vi.mock("@/lib/inngest", () => ({ inngest: { send } }));
vi.mock("@/lib/supabase/server", () => ({ supabaseServer }));
vi.mock("@/lib/transcript", () => ({
  parseTranscript: (transcript: string) => transcript.match(/^\[[^\]]+\]:.*$/gm) ?? []
}));

function makeSupabase() {
  const insertSingle = vi.fn();
  const updateSingle = vi.fn();
  const updateQuery = {
    eq: vi.fn(),
    select: vi.fn(() => ({ single: updateSingle }))
  };
  updateQuery.eq.mockReturnValue(updateQuery);

  const from = vi.fn(() => ({
    insert: vi.fn(() => ({ select: vi.fn(() => ({ single: insertSingle })) })),
    update: vi.fn(() => updateQuery)
  }));

  return { client: { from }, from, insertSingle, updateSingle, updateQuery };
}

function request(body = { callType: "kickoff", transcript: "[Coach]: Hello\n[Client]: Hi" }) {
  return new Request("http://localhost/api/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("POST /api/runs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INNGEST_EVENT_KEY = "configured";
  });

  it("returns the run ID after successful insert and dispatch", async () => {
    const supabase = makeSupabase();
    supabase.insertSingle.mockResolvedValue({ data: { id: "run-1" }, error: null });
    send.mockResolvedValue(undefined);
    supabaseServer.mockReturnValue(supabase.client);

    const response = await POST(request());

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: "run-1" });
    expect(send).toHaveBeenCalledOnce();
    expect(supabase.updateQuery.eq).not.toHaveBeenCalled();
  });

  it.each([
    ["empty", ""],
    ["whitespace-only", "  \n \t"],
    ["without parseable speaker turns", "This is not a speaker turn."]
  ])("rejects a %s transcript", async (_description, transcript) => {
    const supabase = makeSupabase();
    supabaseServer.mockReturnValue(supabase.client);

    const response = await POST(request({ callType: "kickoff", transcript }));

    expect(response.status).toBe(400);
    expect(supabase.from).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("marks the inserted run failed when dispatch fails", async () => {
    const supabase = makeSupabase();
    supabase.insertSingle.mockResolvedValue({ data: { id: "run-2" }, error: null });
    supabase.updateSingle.mockResolvedValue({ data: { id: "run-2" }, error: null });
    send.mockRejectedValue(new Error("provider secret and stack trace"));
    supabaseServer.mockReturnValue(supabase.client);

    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "The evaluation could not be queued for processing. Please try again." });
    expect(supabase.updateQuery.eq).toHaveBeenNthCalledWith(1, "id", "run-2");
    expect(supabase.updateQuery.eq).toHaveBeenNthCalledWith(2, "status", "queued");
    expect(supabase.updateSingle).toHaveBeenCalledOnce();
    expect(supabase.updateSingle.mock.contexts[0]).toBeDefined();
  });

  it("still returns a sanitized dispatch error when failure recording fails", async () => {
    const supabase = makeSupabase();
    supabase.insertSingle.mockResolvedValue({ data: { id: "run-3" }, error: null });
    supabase.updateSingle.mockRejectedValue(new Error("database details"));
    send.mockRejectedValue(new Error("provider details"));
    supabaseServer.mockReturnValue(supabase.client);

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({ error: "The evaluation could not be queued for processing. Please try again." });
    expect(JSON.stringify(body)).not.toContain("details");
  });
});

describe("dispatch failure handling", () => {
  it("is safe to repeat when the run is no longer queued", async () => {
    const supabase = makeSupabase();
    supabase.updateSingle
      .mockResolvedValueOnce({ data: { id: "run-4" }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "Run was not queued." } });

    await expect(markDispatchFailure(supabase.client, "run-4")).resolves.toBeUndefined();
    await expect(markDispatchFailure(supabase.client, "run-4")).resolves.toBeUndefined();
    expect(supabase.updateSingle).toHaveBeenCalledTimes(2);
  });
});