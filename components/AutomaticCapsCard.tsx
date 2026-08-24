import { ShieldCheck, Flag } from "lucide-react";
import type { AppliedCap } from "@/lib/rubrics/types";

export function AutomaticCapsCard({ caps }: { caps: AppliedCap[] }) {
  if (caps.length === 0) return null;

  const binding = caps.filter((c) => c.binding);
  const nonBinding = caps.filter((c) => !c.binding);

  return (
    <div className="h-full flex flex-col border border-line rounded-xl bg-white/40 px-5 py-4">
      <div className="flex items-center gap-2 mb-3.5">
        <ShieldCheck size={17} className="text-inkMuted" aria-hidden="true" />
        <span className="text-sm font-medium text-ink">Caps</span>
        <span className="text-xs text-inkMuted ml-auto">{caps.length} checked</span>
      </div>
      {binding.length > 0 && <div className="space-y-2 mb-1">{binding.map((cap) => <div key={cap.id} className="bg-amber-light rounded-md px-3 py-2.5"><p className="flex items-center gap-1.5 text-sm font-medium text-amber leading-tight"><Flag size={14} aria-hidden="true" fill="currentColor" />Capped</p><p title={cap.note} className="text-xs text-amber/80 mt-1 line-clamp-1">{cap.note}</p></div>)}</div>}
      {nonBinding.length > 0 && <><p className="text-xs uppercase tracking-wide text-inkMuted mt-3.5 mb-2">Checked, didn't lower the score further</p><ul className="space-y-2">{nonBinding.map((cap) => <li key={cap.id} title={cap.note} className="text-sm text-ink leading-relaxed flex gap-2"><span className="text-inkMuted shrink-0">&bull;</span>{cap.label}</li>)}</ul></>}
    </div>
  );
}