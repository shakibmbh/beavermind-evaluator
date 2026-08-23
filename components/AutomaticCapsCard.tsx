import { ShieldCheck, Flag } from "lucide-react";
import type { AppliedCap } from "@/lib/rubrics/types";

export function AutomaticCapsCard({ caps }: { caps: AppliedCap[] }) {
  if (caps.length === 0) return null;

  const binding = caps.filter((c) => c.binding);
  const nonBinding = caps.filter((c) => !c.binding);

  return (
    <div className="border border-line rounded-xl bg-white/40 px-5 py-4">
      <div className="flex items-center gap-2 mb-3.5">
        <ShieldCheck size={17} className="text-inkMuted" aria-hidden="true" />
        <span className="text-sm font-medium text-ink">Automatic caps</span>
        <span className="text-xs text-inkMuted ml-auto">{caps.length} triggered, {binding.length} changed the score</span>
      </div>
      {binding.length > 0 && <div className="space-y-2 mb-1">{binding.map((cap) => <div key={cap.id} className="flex items-start gap-2.5 bg-amber-light rounded-md px-3 py-2.5"><Flag size={14} className="text-amber mt-0.5 shrink-0" aria-hidden="true" fill="currentColor" /><div><p className="text-sm font-medium text-amber leading-tight">{cap.label}</p><p className="text-xs text-amber/80 mt-0.5">{cap.note}</p></div></div>)}</div>}
      {nonBinding.length > 0 && <><p className="text-xs uppercase tracking-wide text-inkMuted mt-3.5 mb-2">Also triggered, no score impact</p><div className="flex flex-wrap gap-2">{nonBinding.map((cap) => <span key={cap.id} title={cap.note} className="inline-flex items-center gap-1.5 text-xs text-inkMuted bg-paper border border-line rounded-full px-2.5 py-1.5"><Flag size={12} aria-hidden="true" />{cap.label}</span>)}</div></>}
    </div>
  );
}