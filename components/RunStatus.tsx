"use client";

import { useEffect, useRef, useState } from "react";
import type { RunResponse } from "@/lib/run-response";
import { ReportView } from "@/components/ReportView";
import type { ScoredReport } from "@/lib/rubrics/types";

const TERMINAL_STATUSES = ["done", "failed"];

export function RunStatus({ initialRun }: { initialRun: RunResponse }) {
  const [run, setRun] = useState<RunResponse>(initialRun);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (TERMINAL_STATUSES.includes(run.status)) return;

    // Poll through the server route so the anon browser client never gets
    // direct read access to the runs table.
    const refreshRun = async () => {
      try {
        const response = await fetch(`/api/runs/${encodeURIComponent(run.id)}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`status ${response.status}`);
        setRun((await response.json()) as RunResponse);
      } catch (error) {
        console.error("Failed to refresh run status", error);
      }
    };

    void refreshRun();
    pollRef.current = setInterval(() => void refreshRun(), 4000);

    return () => {
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
