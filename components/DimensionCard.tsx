"use client";

import { useState } from "react";
import { ChevronDown, Quote as QuoteIcon, Wrench } from "lucide-react";
import { ScoreBar } from "./ScoreBar";
import { splitQuoteIntoTurns, truncateQuoteText } from "@/lib/format-quote";
import { dimensionStatus } from "@/lib/band-status";
import type { DimensionResult } from "@/lib/rubrics/types";

export function DimensionCard({
  dimension,
  coachName,
  clientName
}: {
  dimension: DimensionResult;
  coachName: string;
  clientName: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [expandedQuotes, setExpandedQuotes] = useState<Set<number>>(new Set());
  const number = dimension.id.replace(/\D/g, "");
  const status = dimensionStatus(dimension.disabled ? "N/A" : dimension.band);
  const visibleQuotes = Array.isArray(dimension.keyEvidence) && dimension.keyEvidence.length > 0
    ? dimension.keyEvidence
    : dimension.quotes;

  return (
    <div className="border border-line rounded-lg overflow-hidden bg-white/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <span className="w-7 h-7 rounded-full bg-teal-light text-teal text-xs font-medium flex items-center justify-center shrink-0" aria-hidden="true">
          {number}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span className="text-sm font-medium text-ink truncate">{dimension.name}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-mono text-inkMuted">{dimension.disabled ? "N/A" : `${dimension.score}/${dimension.max}`}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${status.bg} ${status.text}`}>{status.label}</span>
            </div>
          </div>
          <ScoreBar score={dimension.score} max={dimension.max} band={dimension.band} />
        </div>
        <ChevronDown size={16} className={`text-inkMuted shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="pl-[52px] pr-4 pb-4 pt-1 border-t border-line/70 space-y-3">
          {dimension.disabled ? (
            <p className="text-sm text-inkMuted italic">
              {dimension.disabledReason ?? "This dimension did not apply to this call."}
            </p>
          ) : (
            <>
              <p className="text-sm text-ink leading-relaxed">{dimension.reasoning}</p>

              <div>
                <div className="flex items-center gap-1.5 text-xs text-inkMuted mb-2">
                  <QuoteIcon size={13} aria-hidden="true" />
                  <span className="uppercase tracking-wide">Evidence</span>
                </div>
                {visibleQuotes.length > 0 ? (
                  <div className="space-y-2.5">
                  {visibleQuotes.map((q, i) => (
                    <div key={i} className="border-l-2 border-line pl-3 py-0.5 space-y-1">
                      {splitQuoteIntoTurns(q, coachName, clientName).map((turn, j) => (
                        <p key={j} className="font-mono text-xs leading-relaxed">
                          <span className="text-inkMuted">L{turn.lineId} </span>
                          <span className="text-teal font-medium">{turn.speakerLabel}: </span>
                          {(() => {
                            const truncated = truncateQuoteText(turn.text);
                            const expanded = expandedQuotes.has(i);
                            return (
                              <>
                                <span className="text-inkMuted">{expanded ? turn.text : truncated.text}</span>
                                {truncated.truncated && (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedQuotes((current) => {
                                      const next = new Set(current);
                                      if (expanded) next.delete(i);
                                      else next.add(i);
                                      return next;
                                    })}
                                    className="ml-1 text-xs text-teal underline-offset-2 hover:underline"
                                  >
                                    {expanded ? "Show less" : "Show full turn"}
                                  </button>
                                )}
                              </>
                            );
                          })()}
                        </p>
                      ))}
                    </div>
                  ))}
                  </div>
                ) : (
                  <p className="text-xs text-inkMuted italic">No verbatim transcript evidence for this claim.</p>
                )}
              </div>

              <div className="flex items-start gap-1.5 text-sm text-teal pt-1">
                <Wrench size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p>
                <span className="font-medium">Quick fix: </span>
                {dimension.quickFix}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
