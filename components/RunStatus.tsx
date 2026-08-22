"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { RunRow } from "@/lib/supabase/types";
import { ReportView } from "@/components/ReportView";
import type { ScoredReport } from "@/lib/rubrics/types";

const TERMINAL_STATUSES = ["done", "failed"];

export function RunStatus({ initialRun }: { initialRun: RunRow }) {
  const [run, setRun] = useState<RunRow>(initialRun);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (TERMINAL_STATUSES.includes(run.status)) return;

    const supabase = supabaseBrowser();

    // Primary: live updates via Realtime.
    const channel = supabase
      .channel(`run-${run.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "runs", filter: `id=eq.${run.id}` },
        (payload) => setRun(payload.new as RunRow)
      )
      .subscribe();

    // Safety net: poll every 4s in case Realtime doesn't fire (e.g. a
    // dropped websocket). Cheap at this scale and guarantees the page
    // never gets stuck showing a stale "running" state.
    const refreshRun = async () => {
      const { data, error } = await supabase.from("runs").select("*").eq("id", run.id).single<RunRow>();
      if (data) setRun(data);
      if (error) console.error("Failed to refresh run status", error);
    };

    void refreshRun();
    pollRef.current = setInterval(() => void refreshRun(), 4000);

    return () => {
      supabase.removeChannel(channel);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [run.id, run.status]);

  useEffect(() => {
    if (TERMINAL_STATUSES.includes(run.status) && pollRef.current) {
      clearInterval(pollRef.current);
    }
  }, [run.status]);

  if (run.status === "queued" || run.status === "running") {
    return <PendingState status={run.status} />;
  }

  if (run.status === "failed") {
    return <FailedState message={run.error_message} />;
  }

  return (
    <ReportView
      report={run.result as ScoredReport}
      callType={run.call_type}
      pdfUrl={run.pdf_url}
    />
  );
}

function PendingState({ status }: { status: "queued" | "running" }) {
  return (
    <div className="py-24 text-center">
      <div className="inline-block h-8 w-8 rounded-full border-2 border-teal border-t-transparent animate-spin mb-6" />
      <p className="font-display italic text-2xl text-teal mb-2">
        {status === "queued" ? "Queued" : "Scoring in progress"}
      </p>
      <p className="text-inkMuted text-sm max-w-md mx-auto">
        {status === "queued"
          ? "This run is waiting to start. You can close this tab -- it'll keep going and be here when you're back."
          : "The call is being scored against the rubric, dimension by dimension. This usually takes under a minute."}
      </p>
    </div>
  );
}

function FailedState({ message }: { message: string | null }) {
  const displayMessage = typeof message === "string" ? message : "Scoring failed after retries.";

  return (
    <div className="py-24 text-center">
      <p className="font-display italic text-2xl text-flag mb-3">This run failed</p>
      <p className="text-inkMuted text-sm max-w-md mx-auto mb-4">{displayMessage}</p>
      <a href="/" className="text-sm text-teal underline underline-offset-2">
        Start a new evaluation
      </a>
    </div>
  );
}
