function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordSet(text: string): Set<string> {
  return new Set(normalize(text).split(" ").filter((w) => w.length > 2));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const word of a) if (b.has(word)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const FUZZY_THRESHOLD = 0.6;
const MAX_ITEMS_FOR_FUZZY_CHECK = 400;

/**
 * Simple Stage-1 duplicate heuristic (no AI/embeddings available): flags
 * exact normalized-text matches always, and near-duplicates by word overlap
 * when the question count is small enough for an O(n^2) pass.
 */
export function findDuplicateQuestionIds(
  questions: { id: string; originalText: string }[],
): Set<string> {
  const duplicateIds = new Set<string>();

  const byNormalized = new Map<string, string[]>();
  for (const q of questions) {
    const key = normalize(q.originalText);
    const list = byNormalized.get(key) ?? [];
    list.push(q.id);
    byNormalized.set(key, list);
  }
  for (const ids of byNormalized.values()) {
    if (ids.length > 1) ids.forEach((id) => duplicateIds.add(id));
  }

  if (questions.length <= MAX_ITEMS_FOR_FUZZY_CHECK) {
    const sets = questions.map((q) => ({ id: q.id, words: wordSet(q.originalText) }));
    for (let i = 0; i < sets.length; i++) {
      for (let j = i + 1; j < sets.length; j++) {
        if (jaccard(sets[i].words, sets[j].words) >= FUZZY_THRESHOLD) {
          duplicateIds.add(sets[i].id);
          duplicateIds.add(sets[j].id);
        }
      }
    }
  }

  return duplicateIds;
}
