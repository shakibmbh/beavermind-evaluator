import type { ModelScoredReport } from "./rubrics/types";

function normalize(s: string): string {
  // Collapse whitespace and smart-quote variants so minor formatting
  // differences (e.g. curly vs straight apostrophes) don't cause a false
  // "unverified" flag on a quote that's genuinely in the transcript.
  return s
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Returns a new report where every quote is guaranteed to be a verbatim
 * substring of the transcript, plus a count of how many quotes were
 * removed for failing that check. Dimensions are never re-scored here --
 * only their evidence list is pruned -- so a bad quote surfaces as
 * "0 verified lines for this claim" rather than being silently trusted.
 */
export function verifyQuotes(
  report: ModelScoredReport,
  transcript: string
): { report: ModelScoredReport; unverifiedQuoteCount: number } {
  const normalizedTranscript = normalize(transcript);
  let unverifiedQuoteCount = 0;

  const dimensions = report.dimensions.map((dim) => {
    const verifiedQuotes = dim.quotes.filter((q) => {
      const ok = q.trim().length > 0 && normalizedTranscript.includes(normalize(q));
      if (!ok) unverifiedQuoteCount += 1;
      return ok;
    });
    return { ...dim, quotes: verifiedQuotes };
  });

  return {
    report: { ...report, dimensions },
    unverifiedQuoteCount
  };
}
