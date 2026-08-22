import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { inngest } from "@/lib/inngest";

export async function POST(request: Request) {
  try {
    const { callType, transcript } = await request.json();

    if (!callType || !transcript) {
      return NextResponse.json({ error: "Missing callType or transcript" }, { status: 400 });
    }
    if (transcript.length > 200000) {
      return NextResponse.json({ error: "Transcript too long (max 200KB)" }, { status: 400 });
    }

    const { data: run, error } = await supabase
      .from("runs")
      .insert({ call_type: callType, transcript, status: "queued" })
      .select()
      .single();

    if (error || !run) {
      return NextResponse.json({ error: "Failed to create run" }, { status: 500 });
    }

    await inngest.send({
      name: "transcript.submitted",
      data: { runId: run.id, callType, transcript },
    });

    await supabase.from("runs").update({ status: "running" }).eq("id", run.id);

    return NextResponse.json({ runId: run.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
