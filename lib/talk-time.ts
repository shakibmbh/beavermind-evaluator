import { parseTranscript } from "./transcript";

export interface TalkTimeResult {
  coachName: string;
  clientName: string | null;
  coachWordShare: number;
  totalTurns: number;
}

export function computeTalkTime(transcript: string): TalkTimeResult {
  const lines = parseTranscript(transcript);
  const wordCounts = new Map<string, number>();
  const speakerOrder: string[] = [];

  for (const line of lines) {
    const words = line.text.length > 0 ? line.text.split(/\s+/).length : 0;
    if (!wordCounts.has(line.speaker)) {
      wordCounts.set(line.speaker, 0);
      speakerOrder.push(line.speaker);
    }
    wordCounts.set(line.speaker, wordCounts.get(line.speaker)! + words);
  }

  const coachName = speakerOrder[0] ?? "Unknown";
  const clientName = speakerOrder.find((s) => s !== coachName) ?? null;
  const totalWords = [...wordCounts.values()].reduce((a, b) => a + b, 0);
  const coachWords = wordCounts.get(coachName) ?? 0;
  const coachWordShare = totalWords > 0 ? (coachWords / totalWords) * 100 : 0;

  return { coachName, clientName, coachWordShare, totalTurns: lines.length };
}
