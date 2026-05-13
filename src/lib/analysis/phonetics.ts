import { dictionary as cmuDictionary } from "cmu-pronouncing-dictionary";
import { countSyllables } from "./syllables";
import type { RhymeSuggestion, RhymeType } from "./types";

const VOWEL_RE = /\d$/;
const pronunciationEntries = buildPronunciationEntries();
const pronunciationMap = new Map(pronunciationEntries.map((entry) => [entry.word, entry.phonemes]));

type PronunciationEntry = {
  word: string;
  phonemes: string[];
};

export function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/^'+|'+$/g, "").replace(/[^a-z']/g, "");
}

export function getPhonemes(word: string): string[] {
  const normalized = normalizeWord(word);
  const found = pronunciationMap.get(normalized);
  if (found) return found;
  return heuristicPhonemes(normalized);
}

export function rhymeKeyFromPhonemes(phonemes: string[]): string {
  const lastStress = findLastStressIndex(phonemes);
  if (lastStress >= 0) return phonemes.slice(lastStress).join(" ");
  const lastVowel = findLastVowelIndex(phonemes);
  return phonemes.slice(Math.max(0, lastVowel)).join(" ");
}

export function multiRhymeKeyFromPhonemes(phonemes: string[]): string {
  const vowels = phonemes
    .map((phoneme, index) => ({ phoneme, index }))
    .filter(({ phoneme }) => VOWEL_RE.test(phoneme));
  const start = vowels.length >= 2 ? vowels[vowels.length - 2].index : findLastVowelIndex(phonemes);
  return phonemes.slice(Math.max(0, start)).join(" ");
}

export function slantKeyFromPhonemes(phonemes: string[]): string {
  return phonemes
    .filter((phoneme) => VOWEL_RE.test(phoneme))
    .slice(-2)
    .map((phoneme) => phoneme.replace(/\d/g, ""))
    .join(" ");
}

export function endingKey(word: string): string {
  const normalized = normalizeWord(word);
  if (normalized.length <= 3) return normalized;
  const match = normalized.match(/[aeiouy][a-z']{1,5}$/);
  return match?.[0] ?? normalized.slice(-3);
}

export function getRhymeSuggestions(word: string, limit = 36): RhymeSuggestion[] {
  const normalized = normalizeWord(word);
  if (!normalized) return [];

  const phonemes = getPhonemes(normalized);
  const rhymeKey = rhymeKeyFromPhonemes(phonemes);
  const multiKey = multiRhymeKeyFromPhonemes(phonemes);
  const slantKey = slantKeyFromPhonemes(phonemes);
  const suggestions: RhymeSuggestion[] = [];

  for (const entry of pronunciationEntries) {
    const entryWord = entry.word.toLowerCase();
    if (entryWord === normalized) continue;

    const entryRhymeKey = rhymeKeyFromPhonemes(entry.phonemes);
    const entryMultiKey = multiRhymeKeyFromPhonemes(entry.phonemes);
    const entrySlantKey = slantKeyFromPhonemes(entry.phonemes);
    const type: RhymeType | undefined =
      entryMultiKey === multiKey && countSyllables(entry.word) > 1
        ? "multi"
        : entryRhymeKey === rhymeKey
          ? "perfect"
          : entrySlantKey && entrySlantKey === slantKey
            ? "slant"
            : undefined;

    if (type) {
      suggestions.push({
        word: entry.word,
        type,
        syllables: countSyllables(entry.word),
        rhymeKey: entryRhymeKey,
        score: scoreSuggestion(type, normalized, entry.word, entryRhymeKey, rhymeKey)
      });
    }
  }

  return suggestions
    .sort((a, b) => b.score - a.score || typeRank(a.type) - typeRank(b.type) || a.word.localeCompare(b.word))
    .slice(0, limit);
}

export function getDictionarySize(): number {
  return pronunciationEntries.length;
}

function findLastStressIndex(phonemes: string[]): number {
  for (let index = phonemes.length - 1; index >= 0; index -= 1) {
    if (phonemes[index].endsWith("1") || phonemes[index].endsWith("2")) return index;
  }
  return -1;
}

function findLastVowelIndex(phonemes: string[]): number {
  for (let index = phonemes.length - 1; index >= 0; index -= 1) {
    if (VOWEL_RE.test(phonemes[index])) return index;
  }
  return Math.max(0, phonemes.length - 1);
}

function heuristicPhonemes(word: string): string[] {
  if (!word) return [];
  const ending = endingKey(word);
  const vowel = ending.match(/[aeiouy]+/)?.[0] ?? word.match(/[aeiouy]+/)?.[0] ?? "uh";
  const tail = ending.replace(/[aeiouy]+/g, "").toUpperCase();
  return [`${vowel.toUpperCase()}1`, tail].filter(Boolean);
}

function buildPronunciationEntries(): PronunciationEntry[] {
  const seen = new Set<string>();
  const entries: PronunciationEntry[] = [];

  for (const [rawWord, rawPronunciation] of Object.entries(cmuDictionary)) {
    const word = normalizeDictionaryWord(rawWord);
    if (!word || seen.has(word)) continue;
    const phonemes = rawPronunciation
      .split("#")[0]
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!phonemes.length) continue;
    seen.add(word);
    entries.push({ word, phonemes });
  }

  return entries;
}

function normalizeDictionaryWord(word: string): string {
  return normalizeWord(word.replace(/\(\d+\)$/g, ""));
}

function scoreSuggestion(
  type: RhymeType,
  sourceWord: string,
  suggestionWord: string,
  suggestionKey: string,
  sourceKey: string
): number {
  const base = type === "perfect" ? 100 : type === "multi" ? 88 : 62;
  const syllableBonus = Math.min(12, countSyllables(suggestionWord) * 2);
  const keyBonus = suggestionKey === sourceKey ? 8 : 0;
  const repeatPenalty = sourceWord === suggestionWord ? 100 : 0;
  return base + syllableBonus + keyBonus - repeatPenalty;
}

function typeRank(type: RhymeType): number {
  if (type === "perfect") return 0;
  if (type === "multi") return 1;
  return 2;
}
