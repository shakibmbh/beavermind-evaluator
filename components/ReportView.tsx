import { DimensionCard } from "./DimensionCard";
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
  return (
    <div className="space-y-10 pb-16">
      <header className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <p className="font-mono text-xs tracking-widest uppercase text-inkMuted mb-2">
            {callType === "kickoff" ? "Kick-off call" : "Coaching call"} evaluation
          </p>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-5xl italic text-amber">{report.totalScore}</span>
            <span className="text-inkMuted text-lg">/100</span>
            <span className="text-sm font-medium text-teal bg-teal-light px-2.5 py-1 rounded-full ml-2">
              {report.gradeBand}
            </span>
          </div>
          <p className="text-xs text-inkMuted mt-2">
            {report.rawScore} of {report.rawMax} available points across{" "}
            {report.dimensions.filter((d) => !d.disabled).length} active dimensions.
            {report.unverifiedQuoteCount > 0 && (
              <> &middot; {report.unverifiedQuoteCount} unverified quote(s) removed automatically.</>
            )}
          </p>
        </div>

        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-teal text-paper text-sm font-medium px-5 py-2.5 hover:bg-teal-dark transition-colors shrink-0"
          >
            Download PDF
          </a>
        )}
      </header>

      {report.capsApplied.some((c) => c.binding) && (
        <section className="bg-amber-light border border-amber/30 rounded-lg px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-amber font-medium mb-1.5">
            Automatic caps applied
          </p>
          <ul className="space-y-1">
            {report.capsApplied
              .filter((c) => c.binding)
              .map((cap) => (
              <li key={cap.id} className="text-sm text-ink">
                <span className="font-medium">{cap.label}.</span> {cap.note}
              </li>
              ))}
          </ul>
        </section>
      )}

      {report.capsApplied.some((c) => !c.binding) && (
        <p className="text-xs text-inkMuted">
          Also triggered, but didn&apos;t change the score (already lower for other reasons):{" "}
          {report.capsApplied
            .filter((c) => !c.binding)
            .map((c) => c.label)
            .join("; ")}
        </p>
      )}

      <section>
        <h2 className="font-display italic text-xl text-teal mb-3">The one thing</h2>
        <div className="bg-teal-light rounded-lg px-5 py-4">
          <p className="text-ink leading-relaxed">{report.oneThing.change}</p>
          <p className="text-sm text-teal mt-2">
            Projected score with this change:{" "}
            <span className="font-medium">{report.oneThing.projectedScore}/100</span>
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-display italic text-xl text-teal mb-3">The brief</h2>
        <p className="text-ink leading-relaxed">{report.brief}</p>
      </section>

      <section>
        <h2 className="font-display italic text-xl text-teal mb-3">Red flags</h2>
        {report.redFlags.length === 0 ? (
          <p className="text-inkMuted text-sm">None identified in this call.</p>
        ) : (
          <ul className="space-y-2">
            {report.redFlags.map((flag, i) => (
              <li key={i} className="bg-flag-light text-flag rounded-md px-4 py-2.5 text-sm leading-relaxed">
                {flag}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display italic text-xl text-teal mb-3">Dimensions</h2>
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
