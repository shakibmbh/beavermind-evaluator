import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { data: run, error } = await supabase
      .from("runs")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    return NextResponse.json(run);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
