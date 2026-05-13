import { syllable } from "syllable";

export function countSyllables(word: string): number {
  const normalized = word.replace(/[^a-z']/gi, "");
  if (!normalized) return 0;
  return Math.max(1, syllable(normalized));
}
