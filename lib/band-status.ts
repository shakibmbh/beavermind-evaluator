interface BandStatus {
  label: string;
  bg: string;
  text: string;
  barColor: string;
}

const TIER: Record<string, BandStatus> = {
  Elite: { label: "Strong", bg: "bg-teal-light", text: "text-teal", barColor: "bg-teal" },
  Strong: { label: "Strong", bg: "bg-teal-light", text: "text-teal", barColor: "bg-teal" },
  Mid: { label: "Developing", bg: "bg-amber-light", text: "text-amber", barColor: "bg-amber" },
  Weak: { label: "Needs attention", bg: "bg-flag-light", text: "text-flag", barColor: "bg-flag" },
  Fail: { label: "Needs attention", bg: "bg-flag-light", text: "text-flag", barColor: "bg-flag" },
  "N/A": { label: "Not applicable", bg: "bg-line/50", text: "text-inkMuted", barColor: "bg-line" }
};

export function dimensionStatus(band: string): BandStatus {
  return TIER[band] ?? TIER["N/A"];
}