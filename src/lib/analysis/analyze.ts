import { countSyllables } from "./syllables";
import {
  endingKey,
  getPhonemes,
  multiRhymeKeyFromPhonemes,
  normalizeWord,
  rhymeKeyFromPhonemes,
  slantKeyFromPhonemes
} from "./phonetics";
import type { DocumentAnalysis, LineAnalysis, RhymeGroup, Token } from "./types";

const WORD_RE = /[A-Za-z']+/g;

export function analyzeDocument(text: string): DocumentAnalysis {
  const rawLines = text.split("\n");
  const lines: LineAnalysis[] = rawLines.map((raw, lineIndex) => analyzeLine(raw, lineIndex));
  const tokens = lines.flatMap((line) => line.tokens);
  const groups = buildGroups(lines, tokens);
  const groupedTokenIds = new Set(groups.flatMap((group) => group.tokenIds));
  const stats = {
    lineCount: rawLines.filter((line) => line.trim()).length,
    wordCount: tokens.length,
    averageSyllables: lines.length
      ? Math.round((lines.reduce((sum, line) => sum + line.totalSyllables, 0) / Math.max(1, lines.length)) * 10) / 10
      : 0,
    rhymeDensity: tokens.length ? Math.round((groupedTokenIds.size / tokens.length) * 100) : 0
  };

  const groupById = new Map(groups.map((group) => [group.id, group]));
  const nextTokens = tokens.map((token) => {
    const endGroup = groups.find((group) => group.type === "end" && group.tokenIds.includes(token.id));
    const internalGroup = groups.find((group) => group.type !== "end" && group.tokenIds.includes(token.id));
    return {
      ...token,
      groupId: endGroup && groupById.has(endGroup.id) ? endGroup.id : token.groupId,
      internalGroupId: internalGroup?.id ?? token.internalGroupId
    };
  });

  const tokenById = new Map(nextTokens.map((token) => [token.id, token]));
  const nextLines = lines.map((line) => ({
    ...line,
    tokens: line.tokens.map((token) => tokenById.get(token.id) ?? token),
    endToken: line.endToken ? tokenById.get(line.endToken.id) : undefined
  }));

  return { lines: nextLines, tokens: nextTokens, groups, stats };
}

function analyzeLine(raw: string, lineIndex: number): LineAnalysis {
  const tokens: Token[] = [];
  let match: RegExpExecArray | null;
  let wordIndex = 0;
  WORD_RE.lastIndex = 0;

  while ((match = WORD_RE.exec(raw))) {
    const rawWord = match[0];
    const normalized = normalizeWord(rawWord);
    if (!normalized) continue;
    const phonemes = getPhonemes(normalized);
    tokens.push({
      id: `l${lineIndex}-w${wordIndex}`,
      raw: rawWord,
      normalized,
      lineIndex,
      wordIndex,
      start: match.index,
      end: match.index + rawWord.length,
      syllables: countSyllables(normalized),
      phonemes,
      rhymeKey: rhymeKeyFromPhonemes(phonemes),
      slantKey: slantKeyFromPhonemes(phonemes),
      ending: endingKey(normalized),
      isEndWord: false
    });
    wordIndex += 1;
  }

  const endToken = tokens[tokens.length - 1];
  if (endToken) endToken.isEndWord = true;

  return {
    id: `line-${lineIndex}`,
    raw,
    tokens,
    totalSyllables: tokens.reduce((sum, token) => sum + token.syllables, 0),
    endToken
  };
}

function buildGroups(lines: LineAnalysis[], tokens: Token[]): RhymeGroup[] {
  const groups: RhymeGroup[] = [];
  let colorIndex = 0;

  const endBuckets = bucket(
    lines.flatMap((line) => (line.endToken ? [line.endToken] : [])),
    (token) => token.rhymeKey
  );
  for (const [key, bucketTokens] of endBuckets) {
    if (bucketTokens.length < 2 || !key) continue;
    groups.push({ id: `end-${groups.length}`, key, tokenIds: bucketTokens.map((token) => token.id), colorIndex, type: "end" });
    colorIndex += 1;
  }

  const multiBuckets = bucket(tokens, (token) => multiRhymeKeyFromPhonemes(token.phonemes));
  for (const [key, bucketTokens] of multiBuckets) {
    if (bucketTokens.length < 2 || key.split(" ").length < 2) continue;
    groups.push({ id: `internal-${groups.length}`, key, tokenIds: bucketTokens.map((token) => token.id), colorIndex, type: "internal" });
    colorIndex += 1;
  }

  const endingBuckets = bucket(tokens, (token) => token.ending);
  for (const [key, bucketTokens] of endingBuckets) {
    if (bucketTokens.length < 2 || key.length < 3) continue;
    groups.push({ id: `ending-${groups.length}`, key, tokenIds: bucketTokens.map((token) => token.id), colorIndex, type: "ending" });
    colorIndex += 1;
  }

  return groups;
}

function bucket(tokens: Token[], keyer: (token: Token) => string): Map<string, Token[]> {
  const buckets = new Map<string, Token[]>();
  for (const token of tokens) {
    const key = keyer(token);
    if (!key) continue;
    buckets.set(key, [...(buckets.get(key) ?? []), token]);
  }
  return buckets;
}
