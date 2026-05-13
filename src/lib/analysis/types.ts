export type RhymeType = "perfect" | "slant" | "multi";

export type Token = {
  id: string;
  raw: string;
  normalized: string;
  lineIndex: number;
  wordIndex: number;
  start: number;
  end: number;
  syllables: number;
  phonemes: string[];
  rhymeKey: string;
  slantKey: string;
  ending: string;
  groupId?: string;
  internalGroupId?: string;
  isEndWord: boolean;
};

export type LineAnalysis = {
  id: string;
  raw: string;
  tokens: Token[];
  totalSyllables: number;
  endToken?: Token;
};

export type RhymeGroup = {
  id: string;
  key: string;
  tokenIds: string[];
  colorIndex: number;
  type: "end" | "internal" | "ending";
};

export type DocumentStats = {
  lineCount: number;
  wordCount: number;
  averageSyllables: number;
  rhymeDensity: number;
};

export type DocumentAnalysis = {
  lines: LineAnalysis[];
  tokens: Token[];
  groups: RhymeGroup[];
  stats: DocumentStats;
};

export type RhymeSuggestion = {
  word: string;
  type: RhymeType;
  syllables: number;
  rhymeKey: string;
  score: number;
};
