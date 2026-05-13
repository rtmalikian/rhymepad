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

type PersistSource = "api" | "sqlite" | "local";

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
  source: PersistSource;
}> {
  const sqliteState = await loadNativeSqliteState();
  if (sqliteState) return sqliteState;

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
): Promise<PersistSource> {
  saveDocuments(documents);
  saveActiveDocumentId(activeDocumentId);

  if (await saveNativeSqliteState(documents, activeDocumentId)) return "sqlite";

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

async function loadNativeSqliteState(): Promise<{
  documents: RhymeDocument[];
  activeDocumentId: string;
  source: "sqlite";
} | null> {
  const db = await openNativeDatabase();
  if (!db) return null;

  const documentsResult = await db.query("SELECT id, title, text, updated_at FROM documents ORDER BY updated_at DESC");
  const documents = (documentsResult.values ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    title: String(row.title),
    text: String(row.text),
    updatedAt: String(row.updated_at)
  }));

  const activeResult = await db.query("SELECT value FROM app_state WHERE key = ?", ["activeDocumentId"]);
  const activeDocumentId =
    typeof activeResult.values?.[0]?.value === "string" ? activeResult.values[0].value : documents[0]?.id;

  if (!documents.length) return null;
  saveDocuments(documents);
  if (activeDocumentId) saveActiveDocumentId(activeDocumentId);
  return { documents, activeDocumentId: activeDocumentId ?? documents[0].id, source: "sqlite" };
}

async function saveNativeSqliteState(documents: RhymeDocument[], activeDocumentId: string): Promise<boolean> {
  const db = await openNativeDatabase();
  if (!db) return false;

  await db.execute("BEGIN TRANSACTION");
  try {
    for (const document of documents) {
      await db.run(
        `INSERT INTO documents (id, title, text, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           text = excluded.text,
           updated_at = excluded.updated_at`,
        [document.id, document.title, document.text, document.updatedAt]
      );
    }
    await db.run(
      `INSERT INTO app_state (key, value)
       VALUES ('activeDocumentId', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [activeDocumentId]
    );
    await db.execute("COMMIT");
    return true;
  } catch (error) {
    await db.execute("ROLLBACK");
    throw error;
  }
}

let nativeDbPromise: Promise<any | null> | null = null;

async function openNativeDatabase(): Promise<any | null> {
  if (!nativeDbPromise) nativeDbPromise = createNativeDatabase();
  return nativeDbPromise;
}

async function createNativeDatabase(): Promise<any | null> {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return null;

  const { CapacitorSQLite, SQLiteConnection } = await import("@capacitor-community/sqlite");
  const sqlite = new SQLiteConnection(CapacitorSQLite);
  const db = await sqlite.createConnection("rhymepad", false, "no-encryption", 1, false);
  await db.open();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      text TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  return db;
}

function safeParse(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
