import { Flag, ShieldCheck, TriangleAlert } from "lucide-react";
import type { AppliedCap } from "@/lib/rubrics/types";

export function AutomaticCapsCard({ caps }: { caps: AppliedCap[] }) {
  if (caps.length === 0) return null;

  const binding = caps.filter((cap) => cap.binding);
  const nonBinding = caps.filter((cap) => !cap.binding);

  return (
    <div className="flex flex-col border border-line rounded-xl bg-white/40 px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck size={17} className="text-inkMuted" aria-hidden="true" />
        <span className="text-xs font-medium tracking-widest uppercase text-inkMuted">Automatic caps</span>
      </div>

      {binding.length > 0 && (
        <div className="space-y-2">
          {binding.map((cap) => (
            <div key={cap.id} className="rounded-md border border-flag/20 bg-flag-light px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase text-flag leading-tight">
                <Flag size={13} aria-hidden="true" fill="currentColor" />
                Cap applied · score penalty
              </p>
              <p className="text-sm font-medium text-ink mt-1">{cap.label}</p>
              <p title={cap.note} className="text-xs text-inkMuted mt-1 line-clamp-2">{cap.note}</p>
            </div>
          ))}
        </div>
      )}

      {nonBinding.length > 0 && (
        <div className={binding.length > 0 ? "mt-3 rounded-md border border-amber/15 bg-amber-light/60 px-3 py-2.5" : "rounded-md border border-amber/15 bg-amber-light/60 px-3 py-2.5"}>
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase text-amber leading-tight">
              <TriangleAlert size={13} aria-hidden="true" />
              Cap conditions met · no score penalty
            </p>
            <span className="shrink-0 text-[10px] font-medium text-inkMuted">{nonBinding.length} {nonBinding.length === 1 ? "condition" : "conditions"} met</span>
          </div>
          <ul className="space-y-1 mt-2">
            {nonBinding.map((cap) => (
              <li key={cap.id} className="flex gap-2 text-sm text-ink leading-relaxed">
                <span className="text-inkMuted shrink-0">&bull;</span>
                <span>{cap.label}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-inkMuted leading-relaxed mt-2">
            No penalty applied because these conditions did not further reduce an already-limited dimension score.
          </p>
        </div>
      )}
    </div>
  );
}