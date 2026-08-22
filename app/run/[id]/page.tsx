"use client";

import { useState, useCallback } from "react";
import { StatusPolling } from "@/components/status-polling";
import { ReportView } from "@/components/report-view";
import type { Report } from "@/lib/schemas";

export default function RunPage({ params }: { params: { id: string } }) {
  const [report, setReport] = useState<Report | null>(null);

  const handleComplete = useCallback((run: any) => {
    if (run.result_json) setReport(run.result_json);
  }, []);

  if (report) {
    return (
      <main className="min-h-screen bg-background py-12 px-4">
        <ReportView report={report} runId={params.id} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <StatusPolling runId={params.id} onComplete={handleComplete} />
    </main>
  );
}
