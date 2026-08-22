"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { Report } from "@/lib/schemas";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <Button variant="outline" size="sm" disabled><Download className="w-4 h-4 mr-2"/>Loading PDF...</Button> }
);

export function PDFDownloadButton({ report, runId }: { report: Report; runId: string }) {
  return (
    <PDFDownloadLink
      document={<EvaluationPDF report={report} runId={runId} />}
      fileName={`evaluation-${runId}.pdf`}
    >
      <Button variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" />
        Download PDF
      </Button>
    </PDFDownloadLink>
  );
}
