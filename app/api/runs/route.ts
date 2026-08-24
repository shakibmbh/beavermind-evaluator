import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest";
import type { CallType } from "@/lib/rubrics/types";
import { parseTranscript } from "@/lib/transcript";
import { markDispatchFailure } from "@/lib/run-dispatch";

const VALID_CALL_TYPES: CallType[] = ["kickoff", "coaching"];
const MAX_TRANSCRIPT_CHARS = 200_000; // generous headroom above the largest sample (~65KB)
const DISPATCH_FAILURE_MESSAGE = "The evaluation could not be queued for processing. Please try again.";

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

  if (parseTranscript(transcript).length === 0) {
    return NextResponse.json({ error: "transcript must contain at least one valid speaker turn." }, { status: 400 });
  }

  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    return NextResponse.json(
      { error: `transcript exceeds the ${MAX_TRANSCRIPT_CHARS} character limit.` },
      { status: 400 }
    );
  }

  if (!process.env.INNGEST_EVENT_KEY) {
    return NextResponse.json(
      { error: "Inngest is not configured. Set INNGEST_EVENT_KEY in the deployment environment." },
      { status: 503 }
    );
  }

  try {
    const supabase = supabaseServer();

    const { data: run, error } = await supabase
      .from("runs")
      .insert({ call_type: callType as CallType, transcript, status: "queued" })
      .select("id")
      .single();

    if (error || !run) {
      return NextResponse.json(
        { error: `Failed to create run: ${error?.message ?? "No run was returned."}` },
        { status: 500 }
      );
    }

    try {
      // This returns as soon as Inngest has accepted the event.
      await inngest.send({
        name: "run/created",
        data: { runId: run.id, callType, transcript }
      });
    } catch (dispatchError) {
      await markDispatchFailure(supabase, run.id);
      console.error("Failed to dispatch evaluation", dispatchError instanceof Error ? dispatchError.message : "Unknown dispatch error.");
      return NextResponse.json({ error: DISPATCH_FAILURE_MESSAGE }, { status: 503 });
    }

    return NextResponse.json({ id: run.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to start evaluation", error);
    return NextResponse.json(
      { error: "Failed to start the evaluation." },
      { status: 500 }
    );
  }
}
