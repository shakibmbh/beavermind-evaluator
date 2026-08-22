export interface PreprocessingResult {
  coach_word_count: number;
  client_word_count: number;
  coach_percentage: number;
  total_turns: number;
  coach_turns: number;
  client_turns: number;
  has_follow_up_questions: boolean;
  has_north_star: boolean;
  has_structured_recap: boolean;
  has_live_booking: boolean;
  has_long_term_vision: boolean;
  has_concrete_accountability: boolean;
  has_client_struggle: boolean;
  has_action_steps: boolean;
  has_movement_coaching: boolean;
  has_unresolved_confusion: boolean;
  struggle_addressed: boolean;
}

interface Turn { speaker: string; text: string; isCoach: boolean; }

function parseTranscript(transcript: string): Turn[] {
  const lines = transcript.split("\n").filter((l) => l.trim());
  const turns: Turn[] = [];
  for (const line of lines) {
    const match = line.match(/^\[([^\]]+)\]:\s*(.+)$/);
    if (match) {
      const speaker = match[1].trim();
      const text = match[2].trim();
      const isCoach = isCoachSpeaker(speaker, turns);
      turns.push({ speaker, text, isCoach });
    }
  }
  return turns;
}

function isCoachSpeaker(speaker: string, previousTurns: Turn[]): boolean {
  if (previousTurns.length === 0) return true;
  const prev = previousTurns.find((t) => t.speaker === speaker);
  if (prev) return prev.isCoach;
  const uniqueSpeakers = new Set(previousTurns.map((t) => t.speaker));
  return uniqueSpeakers.size === 0;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

function detectFollowUpQuestions(turns: Turn[]): boolean {
  const patterns = [
    /why\s+is\s+that/i, /say\s+more/i, /what\s+do\s+you\s+mean/i,
    /can\s+you\s+tell\s+me\s+more/i, /how\s+did\s+that\s+feel/i,
    /what\s+was\s+that\s+like/i, /push\s+on\s+that/i, /go\s+deeper/i,
    /what\s+would\s+happen\s+if/i, /how\s+would\s+that\s+impact/i,
  ];
  for (let i = 1; i < turns.length; i++) {
    if (turns[i].isCoach && !turns[i - 1].isCoach) {
      const text = turns[i].text;
      if (patterns.some((p) => p.test(text))) return true;
      if (text.includes("?") && turns[i - 1].text.length > 80) return true;
    }
  }
  return false;
}

function detectNorthStar(turns: Turn[]): boolean {
  const patterns = [
    /north\s+star/i, /what\s+I\s+hear\s+you\s+saying/i,
    /what\s+you\s+actually\s+want/i, /that\s+is\s+exactly\s+it/i,
    /that\s+is\s+what\s+we\s?re\s+building/i, /that\s+is\s+our\s+goal/i,
    /that\s+is\s+the\s+(guy|woman|person|version)/i,
    /become\s+the\s+.*(dad|mom|mother|father|person|version)/i,
    /hold\s+onto\s+that/i, /that\s+is\s+what\s+we\s+come\s+back\s+to/i,
  ];
  const fullText = turns.map((t) => t.text).join(" ");
  return patterns.some((p) => p.test(fullText));
}

function detectStructuredRecap(turns: Turn[]): boolean {
  const patterns = [
    /here\s+is\s+what\s+we\s+covered/i, /to\s+recap/i,
    /let\s+me\s+sum\s+up/i, /so\s+today\s+we/i,
    /here\s+is\s+what\s+we\s+did/i, /quick\s+recap/i,
    /let\s+me\s+reflect\s+back/i,
  ];
  const cutoff = Math.floor(turns.length * 0.8);
  const endText = turns.slice(cutoff).map((t) => t.text).join(" ");
  return patterns.some((p) => p.test(endText));
}

function detectLiveBooking(turns: Turn[]): boolean {
  const cutoff = Math.floor(turns.length * 0.7);
  const endText = turns.slice(cutoff).map((t) => t.text).join(" ");
  const hasConfirmation = /(locked in|booked|confirmed|see you|calendar invite|sending invite)/i.test(endText);
  const hasDateOrTime = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}th|\d{1,2}nd|\d{1,2}rd|\d{1,2}st|\d{1,2}:\d{2})/i.test(endText);
  return hasConfirmation && hasDateOrTime;
}

function detectLongTermVision(turns: Turn[]): boolean {
  const patterns = [
    /twelve\s+month/i, /12\s*month/i, /long\s*term/i, /vision/i,
    /where\s+you\s+want\s+to\s+be/i, /next\s+year/i,
    /six\s+months\s+from\s+now/i, /6\s*months/i, /anniversary/i, /milestone/i,
    /goal\s+of/i,
  ];
  const fullText = turns.map((t) => t.text).join(" ");
  return patterns.some((p) => p.test(fullText));
}

function detectConcreteAccountability(turns: Turn[]): boolean {
  const patterns = [
    /send\s+me\s+your/i, /film\s+.*by\s/i, /complete\s+.*by\s/i,
    /message\s+me\s+after/i, /log\s+.*in\s+the\s+app/i,
    /your\s+accountability/i, /before\s+I\s+progress/i,
    /need\s+to\s+see\s+these/i, /specific\s+deliverable/i,
  ];
  const fullText = turns.map((t) => t.text).join(" ");
  return patterns.some((p) => p.test(fullText));
}

function detectClientStruggle(turns: Turn[]): boolean {
  const patterns = [
    /missed/i, /struggling/i, /hard/i, /difficult/i, /frustrated/i,
    /overwhelmed/i, /tears/i, /wobble/i, /behind/i, /can\'t\s+keep\s+up/i,
    /too\s+much/i, /not\s+working/i, /quit/i, /give\s+up/i,
    /disappointed/i, /stressed/i, /anxious/i, /worried/i,
    /didn\'t\s+do/i, /fell\s+off/i, /slipped/i,
  ];
  for (const turn of turns) {
    if (!turn.isCoach && patterns.some((p) => p.test(turn.text))) return true;
  }
  return false;
}

function detectStruggleAddressed(turns: Turn[]): boolean {
  const patterns = [
    /we\s+do\s+not\s+stop/i, /we\s+shift/i,
    /that\s+is\s+not\s+a\s+failure/i, /let\'s\s+problem\s+solve/i,
    /what\s+would\s+help/i, /how\s+can\s+I\s+support/i,
    /offer\s+options/i, /full\s+circle/i,
    /reconnect\s+to\s+why/i, /don\'t\s+defend/i, /stay\s+fact\s+based/i,
  ];
  const fullText = turns.map((t) => t.text).join(" ");
  return patterns.some((p) => p.test(fullText));
}

function detectActionSteps(turns: Turn[]): boolean {
  const coachCommitment = /I\'ll\s+.*by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|this\s+week|the\s+weekend)/i;
  const clientCommitment = /(you\'ll|you\s+will|send|film|complete|do|log)\s+.*by\s/i;
  const fullText = turns.map((t) => t.text).join(" ");
  return coachCommitment.test(fullText) && clientCommitment.test(fullText);
}

function detectMovementCoaching(turns: Turn[]): boolean {
  const fullText = turns.map((t) => t.text).join(" ");
  const clientMovement = /\[.*\]:\s*(going\s+down|stepping|lower\s+down|hold\s+that|breathing|brace|rep|reps|set|sets|movement|squat|lunge|step\s+down|split\s+squat|push\s+up|plank)/i;
  const coachCues = /(set\s+your\s+feet|angle\s+your|camera|breath|brace|slow|tempo|count|hold|drive\s+your|push\s+the|feel\s+that|where\s+do\s+you\s+feel)/i;
  const videoReview = /(screen\s+share|pull\s+up|clip|video|upload|footage|side\s+by\s+side|frame\s+by\s+frame|scrub|watch\s+your)/i;
  const realTimeCorrection = /(stop|hold|right\s+there|adjust|fix|change|try\s+again|do\s+it\s+again|one\s+more|again)/i;
  return clientMovement.test(fullText) || coachCues.test(fullText) || videoReview.test(fullText) || realTimeCorrection.test(fullText);
}

function detectUnresolvedConfusion(turns: Turn[]): boolean {
  const patterns = [
    /i\'m\s+confused/i, /i\s+don\'t\s+understand/i,
    /what\s+do\s+you\s+mean/i, /so\s+what\s+do\s+i\s+do/i,
    /not\s+sure/i, /unclear/i, /lost/i, /don\'t\s+get\s+it/i,
  ];
  for (const turn of turns) {
    if (!turn.isCoach && patterns.some((p) => p.test(turn.text))) {
      const idx = turns.indexOf(turn);
      let resolved = false;
      for (let j = idx + 1; j < Math.min(idx + 4, turns.length); j++) {
        if (turns[j].isCoach && turns[j].text.length > 30) { resolved = true; break; }
      }
      if (!resolved) return true;
    }
  }
  return false;
}

export function preprocessTranscript(transcript: string): PreprocessingResult {
  const turns = parseTranscript(transcript);
  const coachTurns = turns.filter((t) => t.isCoach);
  const clientTurns = turns.filter((t) => !t.isCoach);
  const coachWords = coachTurns.reduce((sum, t) => sum + countWords(t.text), 0);
  const clientWords = clientTurns.reduce((sum, t) => sum + countWords(t.text), 0);
  const totalWords = coachWords + clientWords;
  return {
    coach_word_count: coachWords,
    client_word_count: clientWords,
    coach_percentage: totalWords > 0 ? (coachWords / totalWords) * 100 : 0,
    total_turns: turns.length,
    coach_turns: coachTurns.length,
    client_turns: clientTurns.length,
    has_follow_up_questions: detectFollowUpQuestions(turns),
    has_north_star: detectNorthStar(turns),
    has_structured_recap: detectStructuredRecap(turns),
    has_live_booking: detectLiveBooking(turns),
    has_long_term_vision: detectLongTermVision(turns),
    has_concrete_accountability: detectConcreteAccountability(turns),
    has_client_struggle: detectClientStruggle(turns),
    has_action_steps: detectActionSteps(turns),
    has_movement_coaching: detectMovementCoaching(turns),
    has_unresolved_confusion: detectUnresolvedConfusion(turns),
    struggle_addressed: detectStruggleAddressed(turns),
  };
}
