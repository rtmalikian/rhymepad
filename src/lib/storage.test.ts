import { describe, expect, it } from "vitest";
import { mergeDocuments, type RhymeDocument } from "./storage";

function document(id: string, text: string, updatedAt: string): RhymeDocument {
  return {
    id,
    title: id,
    text,
    updatedAt
  };
}

describe("storage persistence merging", () => {
  it("keeps the newest local note when native SQLite has an older copy", () => {
    const sqlite = [document("verse-01", "older sqlite copy", "2026-05-13T08:00:00.000Z")];
    const local = [document("verse-01", "newer local copy", "2026-05-13T09:00:00.000Z")];

    expect(mergeDocuments(sqlite, local)).toEqual(local);
  });

  it("keeps documents that exist in only one persistence store", () => {
    const sqlite = [document("verse-01", "sqlite note", "2026-05-13T08:00:00.000Z")];
    const local = [document("verse-02", "local note", "2026-05-13T09:00:00.000Z")];

    expect(mergeDocuments(sqlite, local).map((entry) => entry.id)).toEqual(["verse-02", "verse-01"]);
  });
});
