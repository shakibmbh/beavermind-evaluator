import { Download, FileText, Flag } from "lucide-react";
import { DimensionCard } from "./DimensionCard";
import { ScoreGauge } from "./ScoreGauge";
import { AutomaticCapsCard } from "./AutomaticCapsCard";
import type { ScoredReport, CallType } from "@/lib/rubrics/types";

export function ReportView({
  report,
  callType,
  pdfUrl
}: {
  report: ScoredReport;
  callType: CallType;
  pdfUrl: string | null;
}) {
  const activeDimensionCount = report.dimensions.filter((d) => !d.disabled).length;
  const disabledCount = report.dimensions.length - activeDimensionCount;

  return (
    <div className="space-y-8 pb-16">
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-xs tracking-widest uppercase text-inkMuted">
          {callType === "kickoff" ? "Kick-off call" : "Coaching call"} evaluation
        </p>
        {pdfUrl && (
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md bg-teal text-paper text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors shrink-0">
            <Download size={15} aria-hidden="true" />
            Download PDF
          </a>
        )}
      </div>

      <header className="flex items-start justify-between gap-8 flex-wrap-reverse">
        <div className="flex-1 min-w-[280px]">
          <p className="font-display italic text-2xl md:text-[28px] leading-snug text-ink mb-3">&ldquo;{report.oneThing.change}&rdquo;</p>
          <p className="text-sm text-inkMuted">Projected score with this change: <span className="text-teal font-medium">{report.oneThing.projectedScore}/100</span></p>
          <p className="text-xs text-inkMuted mt-3">{report.dimensions.length} dimensions{disabledCount > 0 && <> &middot; {disabledCount} not applicable to this call</>}{report.unverifiedQuoteCount > 0 && <> &middot; {report.unverifiedQuoteCount} unverified quote(s) removed automatically</>}</p>
        </div>
        <ScoreGauge score={report.totalScore} gradeBand={report.gradeBand} />
      </header>

      <AutomaticCapsCard caps={report.capsApplied} />

      <section className="border border-line rounded-xl bg-white/40 px-5 py-4">
        <div className="flex items-center gap-2 mb-3"><FileText size={17} className="text-inkMuted" aria-hidden="true" /><span className="text-sm font-medium text-ink">Executive brief</span></div>
        <p className="text-sm text-ink leading-relaxed">{report.brief}</p>
      </section>

      <section className="border border-line rounded-xl bg-white/40 px-5 py-4">
        <div className="flex items-center gap-2 mb-3"><Flag size={17} className="text-flag" aria-hidden="true" /><span className="text-sm font-medium text-ink">Red flags{report.redFlags.length > 0 && ` (${report.redFlags.length})`}</span></div>
        {report.redFlags.length === 0 ? (
          <p className="text-inkMuted text-sm">None identified in this call.</p>
        ) : (
          <ul className="space-y-2">
            {report.redFlags.map((flag, i) => (
              <li key={i} className="text-sm text-ink leading-relaxed flex gap-2">
                <span className="text-flag shrink-0">&bull;</span>
                {flag}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-baseline gap-2 mb-3"><h2 className="text-sm font-medium text-ink">Dimensions</h2><span className="text-xs text-inkMuted bg-line/40 px-2 py-0.5 rounded-full">{report.dimensions.length} total</span></div>
        <div className="space-y-2">
          {report.dimensions.map((dim) => (
            <DimensionCard
              key={dim.id}
              dimension={dim}
              coachName={report.coachName}
              clientName={report.clientName}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
