const BAND_COLOR: Record<string, string> = {
  Elite: "bg-teal",
  Strong: "bg-teal",
  Mid: "bg-amber",
  Weak: "bg-flag",
  Fail: "bg-flag",
  "N/A": "bg-line"
};

export function ScoreBar({ score, max, band }: { score: number; max: number; band: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (score / max) * 100)) : 0;
  const color = BAND_COLOR[band] ?? "bg-line";

  return (
    <div className="w-full h-1.5 rounded-full bg-line/60 overflow-hidden" aria-hidden>
      <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}
