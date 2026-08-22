import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest";
import type { CallType } from "@/lib/rubrics/types";

const VALID_CALL_TYPES: CallType[] = ["kickoff", "coaching"];
const MAX_TRANSCRIPT_CHARS = 200_000; // generous headroom above the largest sample (~65KB)

export async function POST(req: Request) {
  let body: { callType?: string; transcript?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const { callType, transcript } = body;

  if (!callType || !VALID_CALL_TYPES.includes(callType as CallType)) {
    return NextResponse.json(
      { error: `callType must be one of: ${VALID_CALL_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
    return NextResponse.json({ error: "transcript is required and cannot be empty." }, { status: 400 });
  }

  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    return NextResponse.json(
      { error: `transcript exceeds the ${MAX_TRANSCRIPT_CHARS} character limit.` },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();

  const { data: run, error } = await supabase
    .from("runs")
    .insert({ call_type: callType as CallType, transcript, status: "queued" })
    .select("id")
    .single();

  if (error || !run) {
    return NextResponse.json({ error: `Failed to create run: ${error?.message}` }, { status: 500 });
  }

  // Fire-and-forget: this returns as soon as Inngest has accepted the event,
  // it does not wait for scoring to happen.
  await inngest.send({
    name: "run/created",
    data: { runId: run.id, callType, transcript }
  });

  return NextResponse.json({ id: run.id }, { status: 201 });
}
