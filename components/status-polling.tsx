"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface Run {
  id: string;
  status: "queued" | "running" | "done" | "failed";
  error_message: string | null;
  result_json: any;
}

export function StatusPolling({ runId, onComplete }: { runId: string; onComplete: (run: Run) => void }) {
  const [run, setRun] = useState<Run | null>(null);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/run/${runId}`);
      const data = await res.json();
      setRun(data);
      if (data.status === "done" || data.status === "failed") {
        onComplete(data);
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [runId, onComplete]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (!run) return <div className="text-center py-12">Loading run status...</div>;

  if (run.status === "failed") {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h2 className="text-xl font-semibold text-destructive mb-2">Evaluation Failed</h2>
        <p className="text-muted-foreground">{run.error_message || "Unknown error occurred"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
      <h2 className="text-xl font-semibold">Processing Evaluation{dots}</h2>
      <p className="text-muted-foreground">
        {run.status === "queued" ? "Waiting to start processing..." : "Analyzing transcript against rubric. This may take 30–60 seconds."}
      </p>
      <Progress value={run.status === "running" ? 60 : 20} max={100} className="w-full" />
      <p className="text-xs text-muted-foreground">You can close this tab. The result will be here when you return.</p>
    </div>
  );
}
