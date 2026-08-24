import { Flag } from "lucide-react";

export function RedFlagsCard({ flags }: { flags: string[] }) {
  return (
    <div className="h-full flex flex-col border border-line rounded-xl bg-white/40 px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <Flag size={17} className="text-flag" aria-hidden="true" />
        <span className="text-sm font-medium text-ink">Red flags{flags.length > 0 && ` (${flags.length})`}</span>
      </div>
      {flags.length === 0 ? (
        <div className="flex-1 flex items-center">
          <p className="text-inkMuted text-sm">None identified in this call.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {flags.map((flag, i) => (
            <li key={i} className="text-sm text-ink leading-relaxed flex gap-2">
              <span className="text-flag shrink-0">&bull;</span>
              {flag}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}