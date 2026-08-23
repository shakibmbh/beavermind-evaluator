"use client";

import { useState } from "react";
import { ScoreBar } from "./ScoreBar";
import { splitQuoteIntoTurns } from "@/lib/format-quote";
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

  return (
    <div className="border border-line rounded-lg overflow-hidden bg-white/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-sm font-medium text-ink truncate">{dimension.name}</span>
            <span className="text-sm font-mono text-inkMuted ml-3 shrink-0">
              {dimension.disabled ? "N/A" : `${dimension.score}/${dimension.max}`}
            </span>
          </div>
          <ScoreBar score={dimension.score} max={dimension.max} band={dimension.band} />
        </div>
        <span className="text-inkMuted text-xs shrink-0">{open ? "Hide" : "Details"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-line/70 space-y-3">
          {dimension.disabled ? (
            <p className="text-sm text-inkMuted italic">
              {dimension.disabledReason ?? "This dimension did not apply to this call."}
            </p>
          ) : (
            <>
              <p className="text-xs uppercase tracking-wide text-inkMuted">{dimension.band}</p>
              <p className="text-sm text-ink leading-relaxed">{dimension.reasoning}</p>

              {dimension.quotes.length > 0 ? (
                <div className="space-y-2.5">
                  {dimension.quotes.map((q, i) => (
                    <div key={i} className="border-l-2 border-line pl-3 py-0.5 space-y-1">
                      {splitQuoteIntoTurns(q, coachName, clientName).map((turn, j) => (
                        <p key={j} className="font-mono text-xs leading-relaxed">
                          <span className="text-teal font-medium">{turn.speakerLabel}: </span>
                          <span className="text-inkMuted">{turn.text}</span>
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-inkMuted italic">No verbatim transcript evidence for this claim.</p>
              )}

              <p className="text-sm text-teal">
                <span className="font-medium">Quick fix: </span>
                {dimension.quickFix}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
