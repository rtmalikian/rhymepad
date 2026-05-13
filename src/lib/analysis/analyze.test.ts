import { describe, expect, it } from "vitest";
import { analyzeDocument } from "./analyze";
import { getRhymeSuggestions } from "./phonetics";

const sample = `I write in time while the city lights shine
Cold flow rolls through the code of the line
Motion in the ocean with devotion in my mind
Bright light hits tight rhymes I designed`;

describe("rhyme analysis", () => {
  it("counts words and line syllables", () => {
    const analysis = analyzeDocument(sample);
    expect(analysis.lines).toHaveLength(4);
    expect(analysis.tokens.length).toBeGreaterThan(20);
    expect(analysis.lines[0].totalSyllables).toBeGreaterThan(5);
  });

  it("groups end rhymes and internal rhymes", () => {
    const analysis = analyzeDocument(sample);
    expect(analysis.groups.some((group) => group.type === "end")).toBe(true);
    expect(analysis.groups.some((group) => group.type === "internal" || group.type === "ending")).toBe(true);
  });

  it("returns grouped dictionary suggestions", () => {
    const suggestions = getRhymeSuggestions("time");
    expect(suggestions.map((suggestion) => suggestion.word)).toEqual(expect.arrayContaining(["chime", "rhyme"]));
  });

  it("uses the full CMU dictionary for broader words", () => {
    const suggestions = getRhymeSuggestions("paranoia");
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((suggestion) => suggestion.type === "perfect" || suggestion.type === "slant")).toBe(true);
  });
});
