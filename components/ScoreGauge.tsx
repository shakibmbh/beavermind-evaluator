const BAND_STROKE: Record<string, string> = {
  Elite: "#17494B",
  Strong: "#17494B",
  Inconsistent: "#C98A2C",
  "At Risk": "#B4432F",
  Fail: "#B4432F"
};

const BAND_CHIP: Record<string, { bg: string; text: string }> = {
  Elite: { bg: "bg-teal-light", text: "text-teal" },
  Strong: { bg: "bg-teal-light", text: "text-teal" },
  Inconsistent: { bg: "bg-amber-light", text: "text-amber" },
  "At Risk": { bg: "bg-flag-light", text: "text-flag" },
  Fail: { bg: "bg-flag-light", text: "text-flag" }
};

export function ScoreGauge({ score, gradeBand }: { score: number; gradeBand: string }) {
  const size = 128;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score));
  const dashoffset = circumference * (1 - pct / 100);
  const stroke = BAND_STROKE[gradeBand] ?? "#5B5D57";
  const chip = BAND_CHIP[gradeBand] ?? { bg: "bg-line", text: "text-inkMuted" };

  return (
    <div className="flex flex-col items-center shrink-0" role="img" aria-label={`Score: ${score} out of 100, ${gradeBand}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#DEDDD6" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" fontSize="30" fontWeight="600" fill="#1C1E21">{Math.round(score)}</text>
        <text x="50%" y="66%" textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#5B5D57">/100</text>
      </svg>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full mt-1 ${chip.bg} ${chip.text}`}>{gradeBand}</span>
    </div>
  );
}