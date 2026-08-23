import { dimensionStatus } from "@/lib/band-status";

export function ScoreBar({ score, max, band }: { score: number; max: number; band: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (score / max) * 100)) : 0;
  const color = dimensionStatus(band).barColor;

  return (
    <div className="w-full h-1.5 rounded-full bg-line/60 overflow-hidden" aria-hidden>
      <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}
