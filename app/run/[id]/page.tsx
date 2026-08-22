import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { RunStatus } from "@/components/RunStatus";
import type { RunRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = supabaseServer();
  const { data: run, error } = await supabase
    .from("runs")
    .select("*")
    .eq("id", id)
    .single<RunRow>();

  if (error || !run) {
    notFound();
  }

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <RunStatus initialRun={run} />
      </div>
    </main>
  );
}
