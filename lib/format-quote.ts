import type { EvidenceQuote } from "./rubrics/types";

export interface QuoteTurn {
  lineId: number;
  speakerLabel: string; // "Coach" | "Client" | original name as fallback
  text: string;
}

const TURN_TAG = /\[([^\]]+)\]:\s*/g;

/**
 * Splits a quote string into individual speaking turns and relabels each
 * one as "Coach" or "Client" instead of the raw transcript name -- so a
 * reader doesn't need to remember which of two names is the coach. Quotes
 * are expected to include the "[Speaker]: " prefix, since that's how they
 * appear verbatim in the transcript (and is required for the quote
 * verification substring check to pass in the first place). Falls back to
 * rendering the whole string as one unlabeled turn if no tags are found,
 * rather than dropping the evidence.
 */
export function splitQuoteIntoTurns(
  quote: EvidenceQuote,
  coachName: string,
  clientName: string | null
): QuoteTurn[] {
  const matches = [...quote.text.matchAll(TURN_TAG)];
  if (matches.length === 0) {
    return [{ lineId: quote.lineId, speakerLabel: "Quote", text: quote.text.trim() }];
  }

  const turns: QuoteTurn[] = [];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const name = match[1].trim();
    const start = match.index! + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : quote.text.length;
    const text = quote.text.slice(start, end).trim();
    if (!text) continue;

    let speakerLabel = name;
    if (name === coachName) speakerLabel = "Coach";
    else if (clientName && name === clientName) speakerLabel = "Client";

    turns.push({ lineId: quote.lineId, speakerLabel, text });
  }

  return turns.length > 0 ? turns : [{ lineId: quote.lineId, speakerLabel: "Quote", text: quote.text.trim() }];
}

// Display-only truncation; the full text remains stored and verified.
export function truncateQuoteText(text: string, maxChars = 160): { text: string; truncated: boolean } {
  if (text.length <= maxChars) return { text, truncated: false };

  const boundary = text.slice(0, maxChars).lastIndexOf(" ");
  const cut = boundary > 0 ? boundary : maxChars;
  const truncatedText = text.slice(0, cut).trim().replace(/[\s.,!?;:]+$/, "");
  return { text: `${truncatedText}…`, truncated: true };
}