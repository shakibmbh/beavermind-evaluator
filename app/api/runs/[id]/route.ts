import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import type { RunRow } from "@/lib/supabase/types";
import { toRunResponse } from "@/lib/run-response";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Run not found." }, { status: 404 });
  }

  const { data: run, error } = await supabaseServer()
    .from("runs")
    .select("id, call_type, status, error_message, result, pdf_url")
    .eq("id", id)
    .single<Pick<RunRow, "id" | "call_type" | "status" | "error_message" | "result" | "pdf_url">>();

  if (error || !run) {
    return NextResponse.json({ error: "Run not found." }, { status: 404 });
  }

  return NextResponse.json(toRunResponse(run), { headers: { "Cache-Control": "no-store" } });
}