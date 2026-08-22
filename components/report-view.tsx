"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DimensionCard } from "./dimension-card";
import { PDFDownloadButton } from "./pdf-download-button";
import type { Report } from "@/lib/schemas";

function gradeColor(grade: string) {
  switch (grade) {
    case "Elite": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Strong": return "bg-blue-100 text-blue-800 border-blue-200";
    case "Inconsistent": return "bg-amber-100 text-amber-800 border-amber-200";
    case "At Risk": return "bg-orange-100 text-orange-800 border-orange-200";
    case "Fail": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-gray-100 text-gray-800";
  }
}

export function ReportView({ report, runId }: { report: Report; runId: string }) {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Call Evaluation Report</h1>
        <PDFDownloadButton report={report} runId={runId} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Overall Grade</div>
              <Badge variant="outline" className={`text-lg px-3 py-1 ${gradeColor(report.grade)}`}>
                {report.grade}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Score</div>
              <div className="text-4xl font-bold">
                {report.total_score}
                <span className="text-lg text-muted-foreground font-normal"> / 100</span>
              </div>
              {report.max_possible < 100 && (
                <div className="text-xs text-muted-foreground">
                  Normalized from {report.normalized_score.toFixed(1)} / {report.max_possible}
                </div>
              )}
            </div>
          </div>
          <Progress value={report.total_score} max={100} className="h-3" />
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="text-lg">The One Thing</CardTitle>
          <CardDescription>The single change that moves the number most</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-medium">{report.one_thing.dimension}</p>
          <p className="text-sm text-muted-foreground">{report.one_thing.description}</p>
          <div className="text-sm">
            Current: <span className="font-semibold">{report.one_thing.current_score}</span> → Potential:{" "}
            <span className="font-semibold">{report.one_thing.potential_score}</span>{" "}
            <span className="text-emerald-600 font-medium">(+{report.one_thing.point_gain} points)</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Brief to Coach</CardTitle></CardHeader>
        <CardContent><p className="text-sm leading-relaxed">{report.brief}</p></CardContent>
      </Card>

      {report.red_flags.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader><CardTitle className="text-lg text-destructive">Red Flags</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.red_flags.map((flag, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-destructive mt-0.5">•</span>{flag}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {report.caps.filter(c => c.applies).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Automatic Caps Applied</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.caps.filter(c => c.applies).map((cap, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">⚠</span>
                  <span>
                    <span className="font-medium">{cap.condition}</span>
                    {cap.max_total && <span className="text-muted-foreground"> — Total capped at {cap.max_total}</span>}
                    {cap.dimension_max !== undefined && <span className="text-muted-foreground"> — Dimension capped at {cap.dimension_max}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Dimension Breakdown</h2>
        {report.dimensions.map((dim) => (
          <DimensionCard key={dim.id} dimension={dim} />
        ))}
      </div>
    </div>
  );
}
