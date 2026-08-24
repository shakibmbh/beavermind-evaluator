import { ShieldCheck, TriangleAlert } from "lucide-react";
import type { AppliedCap } from "@/lib/rubrics/types";

export function AutomaticCapsCard({ caps }: { caps: AppliedCap[] }) {
  if (caps.length === 0) return null;

  return (
    <div className="h-full flex flex-col border border-line rounded-xl bg-white/40 px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck size={17} className="text-inkMuted" aria-hidden="true" />
        <span className="text-xs font-medium tracking-widest uppercase text-inkMuted">Automatic caps</span>
      </div>
      <div className="space-y-2">
        {caps.map((cap) => (
          <div
            key={cap.id}
            className={cap.binding
              ? "rounded-md border border-flag/15 bg-flag-light px-3 py-2.5"
              : "rounded-md border border-amber/15 bg-amber-light px-3 py-2.5"}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={cap.binding
                  ? "flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase text-flag leading-tight"
                  : "flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase text-amber leading-tight"}
                >
                  <TriangleAlert size={13} aria-hidden="true" />
                  {cap.binding ? "Cap applied · score penalty" : "Cap condition met · no score penalty"}
                </p>
                <p className="text-sm font-medium text-ink mt-1">{cap.label}</p>
                <p title={cap.note} className="text-xs text-inkMuted mt-1 line-clamp-2">{cap.note}</p>
              </div>
              <span className={cap.binding
                ? "shrink-0 rounded-full bg-flag/10 px-2 py-1 text-[10px] font-semibold text-flag"
                : "shrink-0 rounded-full bg-amber/10 px-2 py-1 text-[10px] font-semibold text-amber"}
              >
                {cap.binding ? "Score penalty" : "0 pts"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}