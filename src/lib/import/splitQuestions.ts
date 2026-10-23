export type QuestionBlock = {
  originalText: string;
  originalAnswer?: string;
  pageReference?: string;
};

const MAX_BLOCKS = 500;
const ANSWER_MARKER = /\n\s*antwort\s*:?\s*\n?/i;

function splitQuestionAndAnswer(raw: string): { originalText: string; originalAnswer?: string } {
  const match = ANSWER_MARKER.exec(raw);
  if (!match) return { originalText: raw.trim() };
  const originalText = raw.slice(0, match.index).trim();
  const originalAnswer = raw.slice(match.index + match[0].length).trim();
  return { originalText, originalAnswer: originalAnswer || undefined };
}

/**
 * Heuristic question splitter for imported PDF/DOCX/TXT text (Stage 1, no
 * AI/LLM available). Admins review and edit every extracted question before
 * publishing, so this only needs to be a reasonable starting point.
 *
 * Tries three strategies and picks whichever finds the most structure in
 * the document (most matches wins, numbered marker ties broken in its
 * favor), rather than a fixed priority order — a numbered section tucked
 * into one corner of an otherwise bullet-listed document would otherwise
 * win by being "first" and silently drop everything else:
 *   1. Numbered list markers ("1.", "2)", "Frage 3:").
 *   2. Bullet lines ("- ", "– ", "• ") — common in oral-exam protocol notes
 *      that list one question per bullet without numbering.
 *   3. Blank-line-separated paragraphs, as a last resort.
 */
export function splitTextIntoBlocks(text: string): QuestionBlock[] {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];

  const numberedMarker = /^[ \t]*(?:frage\s*)?(\d{1,4})[.)][ \t]+/gim;
  const numberedMatches = [...normalized.matchAll(numberedMarker)];

  const bulletMarker = /^[ \t]*[-–•][ \t]+/gm;
  const bulletMatches = [...normalized.matchAll(bulletMarker)];

  let rawBlocks: { text: string; pageReference?: string }[];

  if (numberedMatches.length >= 2 && numberedMatches.length >= bulletMatches.length) {
    rawBlocks = numberedMatches.map((m, i) => {
      const start = m.index ?? 0;
      const end = i + 1 < numberedMatches.length ? (numberedMatches[i + 1].index ?? normalized.length) : normalized.length;
      const content = normalized.slice(start + m[0].length, end).trim();
      return { text: content, pageReference: `Nr. ${m[1]}` };
    });
  } else if (bulletMatches.length >= 3) {
    rawBlocks = bulletMatches.map((m, i) => {
      const start = (m.index ?? 0) + m[0].length;
      const end = i + 1 < bulletMatches.length ? (bulletMatches[i + 1].index ?? normalized.length) : normalized.length;
      return { text: normalized.slice(start, end).trim() };
    });
  } else {
    rawBlocks = normalized
      .split(/\n\s*\n+/)
      .map((p) => ({ text: p.trim() }))
      .filter((p) => p.text.length >= 15);
  }

  const blocks: QuestionBlock[] = rawBlocks
    .slice(0, MAX_BLOCKS)
    .map(({ text: blockText, pageReference }) => {
      const { originalText, originalAnswer } = splitQuestionAndAnswer(blockText);
      return { originalText, originalAnswer, pageReference };
    })
    .filter((b) => b.originalText.length >= 5);

  return blocks;
}
