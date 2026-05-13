import express from "express";
import fs from "node:fs";
import path from "node:path";
import initSqlJs from "sql.js";

const port = Number(process.env.PORT ?? 8080);
const dataDir = process.env.RHYMEPAD_DATA_DIR ?? path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "rhymepad.sqlite");
const staticDir = path.join(process.cwd(), "dist");

fs.mkdirSync(dataDir, { recursive: true });

const SQL = await initSqlJs();
const db = fs.existsSync(dbPath)
  ? new SQL.Database(fs.readFileSync(dbPath))
  : new SQL.Database();

db.run(`
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
persist();

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/documents", (_request, response) => {
  const documents = queryDocuments();
  const activeDocumentId = getState("activeDocumentId");
  response.json({ documents, activeDocumentId });
});

app.put("/api/documents", (request, response) => {
  const documents = Array.isArray(request.body?.documents) ? request.body.documents : [];
  const activeDocumentId = typeof request.body?.activeDocumentId === "string" ? request.body.activeDocumentId : "";

  const upsert = db.prepare(`
    INSERT INTO documents (id, title, text, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      text = excluded.text,
      updated_at = excluded.updated_at
  `);

  db.run("BEGIN TRANSACTION");
  try {
    for (const document of documents) {
      if (!isValidDocument(document)) continue;
      upsert.run([
        document.id,
        document.title,
        document.text,
        document.updatedAt ?? new Date().toISOString()
      ]);
    }
    if (activeDocumentId) setState("activeDocumentId", activeDocumentId);
    db.run("COMMIT");
    persist();
  } catch (error) {
    db.run("ROLLBACK");
    throw error;
  } finally {
    upsert.free();
  }

  response.json({ documents: queryDocuments(), activeDocumentId: getState("activeDocumentId") });
});

app.use(express.static(staticDir));
app.use((request, response, next) => {
  if (request.method !== "GET" || request.path.startsWith("/api/")) {
    next();
    return;
  }
  response.sendFile(path.join(staticDir, "index.html"));
});

const server = app.listen(port, () => {
  console.log(`RhymePad listening on http://0.0.0.0:${port}`);
  console.log(`SQLite database: ${dbPath}`);
});

process.on("SIGTERM", () => {
  persist();
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  persist();
  server.close(() => process.exit(0));
});

function queryDocuments() {
  const rows = [];
  const result = db.exec("SELECT id, title, text, updated_at FROM documents ORDER BY updated_at DESC");
  if (!result[0]) return rows;
  for (const values of result[0].values) {
    rows.push({
      id: String(values[0]),
      title: String(values[1]),
      text: String(values[2]),
      updatedAt: String(values[3])
    });
  }
  return rows;
}

function getState(key) {
  const statement = db.prepare("SELECT value FROM app_state WHERE key = ?");
  statement.bind([key]);
  const value = statement.step() ? String(statement.get()[0]) : "";
  statement.free();
  return value;
}

function setState(key, value) {
  const statement = db.prepare(`
    INSERT INTO app_state (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  statement.run([key, value]);
  statement.free();
}

function persist() {
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
}

function isValidDocument(document) {
  return (
    document &&
    typeof document.id === "string" &&
    typeof document.title === "string" &&
    typeof document.text === "string"
  );
}
