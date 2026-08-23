export interface TranscriptLine {
  id: number;
  speaker: string;
  text: string;
}

const TURN_PATTERN = /^\[([^\]]+)\]:\s*(.*)$/;

export function parseTranscript(transcript: string): TranscriptLine[] {
  const lines: TranscriptLine[] = [];
  let id = 1;
  for (const rawLine of transcript.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(TURN_PATTERN);
    if (!match) continue;
    lines.push({ id: id++, speaker: match[1].trim(), text: match[2].trim() });
  }
  return lines;
}

export function formatNumberedTranscript(lines: TranscriptLine[]): string {
  return lines.map((l) => `L${l.id}: [${l.speaker}]: ${l.text}`).join("\n");
}