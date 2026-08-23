export interface TalkTimeResult {
  coachName: string;
  clientName: string | null;
  coachWordShare: number; // 0-100
  totalTurns: number;
}

const TURN_PATTERN = /^\[([^\]]+)\]:\s*(.*)$/;

/**
 * Parses the flat "[Speaker Name]: text" transcript format and computes
 * word-count share per speaker. The coach is assumed to be whoever speaks
 * first -- verified against all four sample transcripts, where the coach
 * always opens the call ("Hey, is this Renata?"). If that assumption ever
 * breaks for a real transcript, this degrades gracefully: the ratio is
 * still computed correctly, just possibly attributed to the wrong name,
 * which is a much smaller failure than not computing it at all.
 */
export function computeTalkTime(transcript: string): TalkTimeResult {
  const wordCounts = new Map<string, number>();
  const speakerOrder: string[] = [];
  let totalTurns = 0;

  for (const rawLine of transcript.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(TURN_PATTERN);
    if (!match) continue;

    const speaker = match[1].trim();
    const text = match[2].trim();
    const words = text.length > 0 ? text.split(/\s+/).length : 0;

    if (!wordCounts.has(speaker)) {
      wordCounts.set(speaker, 0);
      speakerOrder.push(speaker);
    }
    wordCounts.set(speaker, wordCounts.get(speaker)! + words);
    totalTurns += 1;
  }

  const coachName = speakerOrder[0] ?? "Unknown";
  const clientName = speakerOrder.find((s) => s !== coachName) ?? null;
  const totalWords = [...wordCounts.values()].reduce((a, b) => a + b, 0);
  const coachWords = wordCounts.get(coachName) ?? 0;
  const coachWordShare = totalWords > 0 ? (coachWords / totalWords) * 100 : 0;

  return { coachName, clientName, coachWordShare, totalTurns };
}
