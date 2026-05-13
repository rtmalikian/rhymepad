export const seedText = `I write in time while the city lights shine
Cold flow rolls through the code of the line
Motion in the ocean with devotion in my mind
Bright light hits tight rhymes I designed`;

export type RhymeDocument = {
  id: string;
  title: string;
  text: string;
  updatedAt: string;
};

const documentsKey = "rhyme-pad.documents";
const activeKey = "rhyme-pad.activeDocumentId";

export function loadDocuments(): RhymeDocument[] {
  const parsed = safeParse(localStorage.getItem(documentsKey));
  if (Array.isArray(parsed) && parsed.length > 0) return parsed as RhymeDocument[];
  return [
    {
      id: "verse-01",
      title: "Verse 01",
      text: seedText,
      updatedAt: new Date().toISOString()
    }
  ];
}

export function saveDocuments(documents: RhymeDocument[]): void {
  localStorage.setItem(documentsKey, JSON.stringify(documents));
}

export function loadActiveDocumentId(documents: RhymeDocument[]): string {
  return localStorage.getItem(activeKey) ?? documents[0]?.id ?? "verse-01";
}

export function saveActiveDocumentId(id: string): void {
  localStorage.setItem(activeKey, id);
}

export async function loadPersistedState(): Promise<{
  documents: RhymeDocument[];
  activeDocumentId: string;
  source: "api" | "local";
}> {
  try {
    const response = await fetch("/api/documents");
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const payload = (await response.json()) as {
      documents?: RhymeDocument[];
      activeDocumentId?: string;
    };

    if (Array.isArray(payload.documents) && payload.documents.length > 0) {
      saveDocuments(payload.documents);
      if (payload.activeDocumentId) saveActiveDocumentId(payload.activeDocumentId);
      return {
        documents: payload.documents,
        activeDocumentId: payload.activeDocumentId ?? payload.documents[0].id,
        source: "api"
      };
    }
  } catch {
    // Static preview and offline use intentionally fall back to browser storage.
  }

  const documents = loadDocuments();
  return {
    documents,
    activeDocumentId: loadActiveDocumentId(documents),
    source: "local"
  };
}

export async function persistState(
  documents: RhymeDocument[],
  activeDocumentId: string
): Promise<"api" | "local"> {
  saveDocuments(documents);
  saveActiveDocumentId(activeDocumentId);

  try {
    const response = await fetch("/api/documents", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documents, activeDocumentId })
    });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    return "api";
  } catch {
    return "local";
  }
}

function safeParse(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
