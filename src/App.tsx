import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Download,
  FilePlus2,
  Highlighter,
  ListChecks,
  Menu,
  PenLine,
  RefreshCcw,
  Search,
  Sparkles,
  Wand2,
  X
} from "lucide-react";
import { analyzeDocument } from "./lib/analysis/analyze";
import { getRhymeSuggestions } from "./lib/analysis/phonetics";
import type { RhymeSuggestion, Token } from "./lib/analysis/types";
import {
  loadActiveDocumentId,
  loadDocuments,
  loadPersistedState,
  persistState,
  RhymeDocument,
  seedText
} from "./lib/storage";

const promptCommands = [
  { id: "end", label: "Find End Rhymes", icon: Search },
  { id: "internal", label: "Find Internal Rhymes", icon: Highlighter },
  { id: "multi", label: "Suggest Multis", icon: Sparkles },
  { id: "tighten", label: "Tighten Syllables", icon: ListChecks },
  { id: "continue", label: "Continue Scheme", icon: Wand2 },
  { id: "reset", label: "Reset Highlights", icon: RefreshCcw }
];

const groupColors = [
  "var(--rhyme-rose)",
  "var(--rhyme-blue)",
  "var(--rhyme-green)",
  "var(--rhyme-gold)",
  "var(--rhyme-violet)",
  "var(--rhyme-cyan)"
];

export function App() {
  const [documents, setDocuments] = useState<RhymeDocument[]>(() => loadDocuments());
  const [activeDocumentId, setActiveDocumentId] = useState(() => loadActiveDocumentId(loadDocuments()));
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [activeCommand, setActiveCommand] = useState("end");
  const [persistenceStatus, setPersistenceStatus] = useState<"loading" | "api" | "sqlite" | "local">("loading");
  const [hasHydrated, setHasHydrated] = useState(false);
  const activeDocument = documents.find((document) => document.id === activeDocumentId) ?? documents[0];
  const analysis = useMemo(() => analyzeDocument(activeDocument?.text ?? ""), [activeDocument?.text]);
  const selectedToken = analysis.tokens.find((token) => token.id === selectedTokenId);
  const suggestions = useMemo(
    () => (selectedToken ? getRhymeSuggestions(selectedToken.normalized) : []),
    [selectedToken]
  );

  useEffect(() => {
    let isMounted = true;
    loadPersistedState().then((state) => {
      if (!isMounted) return;
      setDocuments(state.documents);
      setActiveDocumentId(state.activeDocumentId);
      setPersistenceStatus(state.source);
      setHasHydrated(true);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    persistState(documents, activeDocumentId).then((source) => setPersistenceStatus(source));
  }, [activeDocumentId, documents, hasHydrated]);

  useEffect(() => {
    if (selectedTokenId && !selectedToken) setSelectedTokenId(null);
  }, [selectedToken, selectedTokenId]);

  function updateText(text: string) {
    setDocuments((current) =>
      current.map((document) =>
        document.id === activeDocument.id ? { ...document, text, updatedAt: new Date().toISOString() } : document
      )
    );
  }

  function createDocument() {
    const id = `verse-${Date.now()}`;
    const document = {
      id,
      title: `Verse ${String(documents.length + 1).padStart(2, "0")}`,
      text: "",
      updatedAt: new Date().toISOString()
    };
    setDocuments((current) => [...current, document]);
    setActiveDocumentId(id);
  }

  function applySuggestion(word: string, mode: "insert" | "replace") {
    if (!selectedToken || !activeDocument) return;
    const lines = activeDocument.text.split("\n");
    const line = lines[selectedToken.lineIndex] ?? "";
    if (mode === "replace") {
      lines[selectedToken.lineIndex] = `${line.slice(0, selectedToken.start)}${word}${line.slice(selectedToken.end)}`;
    } else {
      lines[selectedToken.lineIndex] = `${line.slice(0, selectedToken.end)} ${word}${line.slice(selectedToken.end)}`;
    }
    updateText(lines.join("\n"));
    setSelectedTokenId(null);
  }

  function runPromptCommand(id: string) {
    setActiveCommand(id);
    if (id === "reset") setSelectedTokenId(null);
    if (id === "multi") {
      const firstMulti = analysis.tokens.find((token) => token.syllables > 1);
      setSelectedTokenId(firstMulti?.id ?? analysis.tokens[0]?.id ?? null);
    }
    if (id === "continue") {
      const lastEndWord = [...analysis.lines].reverse().find((line) => line.endToken)?.endToken;
      setSelectedTokenId(lastEndWord?.id ?? analysis.tokens[0]?.id ?? null);
    }
  }

  if (!activeDocument) return null;

  return (
    <main className="app-shell">
      <TopMenu
        activeCommand={activeCommand}
        onCommand={runPromptCommand}
        onNew={createDocument}
        onSeed={() => updateText(seedText)}
      />
      <section className="workspace">
        <aside className="notes-rail" aria-label="Notes">
          <div className="rail-heading">
            <span>RhymePad</span>
            <button type="button" aria-label="New Note" onClick={createDocument}>
              <FilePlus2 size={16} />
            </button>
          </div>
          <div className="document-list">
            {documents.map((document) => (
              <button
                className={document.id === activeDocumentId ? "document-tab active" : "document-tab"}
                key={document.id}
                type="button"
                onClick={() => setActiveDocumentId(document.id)}
              >
                <span>{document.title}</span>
                <small>{document.text.split(/\s+/).filter(Boolean).length} words</small>
              </button>
            ))}
          </div>
          <div className="mini-panel">
            <span>Rhyme Map</span>
            <strong>{analysis.groups.length}</strong>
            <small>active color groups</small>
          </div>
        </aside>

        <EditorSurface
          text={activeDocument.text}
          analysis={analysis}
          selectedTokenId={selectedToken?.id}
          onTextChange={updateText}
          onTokenSelect={setSelectedTokenId}
          onDictionaryClose={() => setSelectedTokenId(null)}
          selectedToken={selectedToken}
          suggestions={suggestions}
          onApplySuggestion={applySuggestion}
          activeCommand={activeCommand}
        />

        <DictionaryPanel
          token={selectedToken}
          suggestions={suggestions}
          onApply={applySuggestion}
        />
      </section>
      <StatusBar analysis={analysis} persistenceStatus={persistenceStatus} />
    </main>
  );
}

function TopMenu({
  activeCommand,
  onCommand,
  onNew,
  onSeed
}: {
  activeCommand: string;
  onCommand: (id: string) => void;
  onNew: () => void;
  onSeed: () => void;
}) {
  return (
    <header className="top-menu">
      <div className="brand-lockup">
        <div className="brand-mark">
          <PenLine size={18} />
        </div>
        <div>
          <strong>RhymePad</strong>
          <span>rhyming dictionary + syllable counter</span>
        </div>
      </div>
      <nav className="prompt-menu" aria-label="Rhyming prompts">
        {promptCommands.map((command) => {
          const Icon = command.icon;
          return (
            <button
              className={activeCommand === command.id ? "prompt-button active" : "prompt-button"}
              key={command.id}
              type="button"
              onClick={() => onCommand(command.id)}
            >
              <Icon size={15} />
              <span>{command.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="top-actions">
        <button type="button" onClick={onSeed}>
          <BookOpen size={16} />
          Analyze
        </button>
        <button type="button" onClick={onNew}>
          <FilePlus2 size={16} />
          New Note
        </button>
        <button type="button" onClick={() => window.print()}>
          <Download size={16} />
          Export
        </button>
      </div>
    </header>
  );
}

function EditorSurface({
  text,
  analysis,
  selectedTokenId,
  selectedToken,
  suggestions,
  onTextChange,
  onTokenSelect,
  onDictionaryClose,
  onApplySuggestion,
  activeCommand
}: {
  text: string;
  analysis: ReturnType<typeof analyzeDocument>;
  selectedTokenId?: string;
  selectedToken?: Token;
  suggestions: RhymeSuggestion[];
  onTextChange: (text: string) => void;
  onTokenSelect: (id: string | null) => void;
  onDictionaryClose: () => void;
  onApplySuggestion: (word: string, mode: "insert" | "replace") => void;
  activeCommand: string;
}) {
  function selectTokenAtCaret(selectionStart: number) {
    const token = findTokenAtTextPosition(text, analysis, selectionStart);
    onTokenSelect(token?.id ?? null);
  }

  return (
    <section className="editor-panel" aria-label="Rhyme editor">
      <div className="editor-header">
        <div>
          <span>Verse 01</span>
          <strong>Syllables</strong>
        </div>
        <div className="editor-modes">
          <span>{activeCommand === "reset" ? "Clean view" : "Rhyme colors active"}</span>
          <Menu size={16} />
        </div>
      </div>
      <div className="editor-grid">
        <div className="analysis-layer" aria-label="Analyzed rhyme lines">
          {analysis.lines.map((line, index) => (
            <LineRow
              key={line.id}
              lineNumber={index + 1}
              line={line}
              groups={analysis.groups}
              selectedTokenId={selectedTokenId}
              hideHighlights={activeCommand === "reset"}
            />
          ))}
        </div>
        <textarea
          aria-label="Rhyme writing notepad"
          className="editor-input"
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          onClick={(event) => selectTokenAtCaret(event.currentTarget.selectionStart)}
          onKeyUp={(event) => {
            if (event.key === "Escape") {
              onDictionaryClose();
              return;
            }
            if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
            selectTokenAtCaret(event.currentTarget.selectionStart);
          }}
          onSelect={(event) => selectTokenAtCaret(event.currentTarget.selectionStart)}
          spellCheck="false"
        />
        {selectedToken ? (
          <InlineDictionaryPopover
            token={selectedToken}
            suggestions={suggestions}
            onApply={onApplySuggestion}
            onClose={onDictionaryClose}
          />
        ) : null}
      </div>
    </section>
  );
}

function LineRow({
  lineNumber,
  line,
  groups,
  selectedTokenId,
  hideHighlights
}: {
  lineNumber: number;
  line: ReturnType<typeof analyzeDocument>["lines"][number];
  groups: ReturnType<typeof analyzeDocument>["groups"];
  selectedTokenId?: string;
  hideHighlights: boolean;
}) {
  const segments = buildLineSegments(line.raw, line.tokens);

  return (
    <div className="line-row">
      <span className="line-number">{lineNumber}</span>
      <div className="line-words">
        {segments.length ? (
          segments.map((segment, index) => {
            if (segment.kind === "text") {
              return <span key={`text-${index}`}>{segment.text}</span>;
            }
            const group = groups.find((candidate) => candidate.tokenIds.includes(segment.token.id));
            const color = group && !hideHighlights ? groupColors[group.colorIndex % groupColors.length] : "transparent";
            return (
              <span
                key={segment.token.id}
                className={segment.token.id === selectedTokenId ? "word-chip selected" : "word-chip"}
                style={{ "--group-color": color } as React.CSSProperties}
                title={`${segment.token.raw}: ${segment.token.syllables} syllable${segment.token.syllables === 1 ? "" : "s"}`}
              >
                <span className="word-count">{segment.token.syllables}</span>
                <span className="word-text">{segment.token.raw}</span>
                <span className="ending-mark">{segment.token.ending}</span>
              </span>
            );
          })
        ) : (
          <span className="empty-line">Start writing...</span>
        )}
      </div>
      <span className="line-total">{line.totalSyllables}</span>
    </div>
  );
}

function InlineDictionaryPopover({
  token,
  suggestions,
  onApply,
  onClose
}: {
  token: Token;
  suggestions: RhymeSuggestion[];
  onApply: (word: string, mode: "insert" | "replace") => void;
  onClose: () => void;
}) {
  const top = 86 + token.lineIndex * 58;
  const grouped = {
    perfect: suggestions.filter((suggestion) => suggestion.type === "perfect").slice(0, 4),
    slant: suggestions.filter((suggestion) => suggestion.type === "slant").slice(0, 4),
    multi: suggestions.filter((suggestion) => suggestion.type === "multi").slice(0, 3)
  };

  return (
    <div
      className="dictionary-popover"
      role="dialog"
      aria-label={`Rhyming dictionary for ${token.raw}`}
      style={{ top }}
    >
      <div className="popover-heading">
        <div>
          <span>Dictionary</span>
          <strong>{token.raw}</strong>
          <small>{token.syllables} syllable{token.syllables === 1 ? "" : "s"}</small>
        </div>
        <button type="button" className="popover-close" aria-label="Close dictionary" onClick={onClose}>
          <X size={17} />
        </button>
      </div>
      {(["perfect", "slant", "multi"] as const).map((type) => (
        <section className="popover-group" key={type}>
          <span>{type === "perfect" ? "Perfect" : type === "slant" ? "Slant" : "Multi"}</span>
          <div>
            {grouped[type].length ? (
              grouped[type].map((suggestion) => (
                <button
                  type="button"
                  key={`${type}-${suggestion.word}`}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => onApply(suggestion.word, "insert")}
                >
                  {suggestion.word}
                </button>
              ))
            ) : (
              <small>No local matches</small>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

type LineSegment =
  | { kind: "text"; text: string }
  | { kind: "token"; token: Token };

function buildLineSegments(raw: string, tokens: Token[]): LineSegment[] {
  if (!raw) return [];
  const segments: LineSegment[] = [];
  let cursor = 0;
  for (const token of tokens) {
    if (token.start > cursor) {
      segments.push({ kind: "text", text: raw.slice(cursor, token.start) });
    }
    segments.push({ kind: "token", token });
    cursor = token.end;
  }
  if (cursor < raw.length) {
    segments.push({ kind: "text", text: raw.slice(cursor) });
  }
  return segments;
}

function findTokenAtTextPosition(
  text: string,
  analysis: ReturnType<typeof analyzeDocument>,
  position: number
): Token | undefined {
  let lineStart = 0;
  for (const line of analysis.lines) {
    const lineEnd = lineStart + line.raw.length;
    if (position >= lineStart && position <= lineEnd) {
      const column = position - lineStart;
      return line.tokens.find((token) => column >= token.start && column <= token.end);
    }
    lineStart = lineEnd + 1;
  }

  if (position === text.length) {
    const lastLine = analysis.lines[analysis.lines.length - 1];
    const lastToken = lastLine?.tokens[lastLine.tokens.length - 1];
    if (lastToken && position > 0 && /[A-Za-z']/.test(text[position - 1] ?? "")) return lastToken;
  }

  return undefined;
}

function DictionaryPanel({
  token,
  suggestions,
  onApply
}: {
  token?: Token;
  suggestions: RhymeSuggestion[];
  onApply: (word: string, mode: "insert" | "replace") => void;
}) {
  const grouped = {
    perfect: suggestions.filter((suggestion) => suggestion.type === "perfect"),
    slant: suggestions.filter((suggestion) => suggestion.type === "slant"),
    multi: suggestions.filter((suggestion) => suggestion.type === "multi")
  };

  return (
    <aside className="dictionary-panel" aria-label="Dictionary">
      <div className="dictionary-heading">
        <span>Dictionary</span>
        <strong>{token?.raw ?? "Select a word"}</strong>
        <small>{token ? `${token.syllables} syllable${token.syllables === 1 ? "" : "s"}` : "Click any word in the editor"}</small>
      </div>
      {(["perfect", "slant", "multi"] as const).map((type) => (
        <section className="suggestion-group" key={type}>
          <div className="suggestion-title">
            <span>{type === "perfect" ? "Perfect" : type === "slant" ? "Slant" : "Multi"}</span>
            <small>{grouped[type].length}</small>
          </div>
          <div className="suggestions">
            {grouped[type].length ? (
              grouped[type].slice(0, 8).map((suggestion) => (
                <div className="suggestion" key={`${type}-${suggestion.word}`}>
                  <span>{suggestion.word}</span>
                  <small>{suggestion.syllables} syl</small>
                  <button type="button" onClick={() => onApply(suggestion.word, "replace")}>
                    Replace
                  </button>
                  <button type="button" onClick={() => onApply(suggestion.word, "insert")}>
                    Insert
                  </button>
                </div>
              ))
            ) : (
              <p>No local matches yet.</p>
            )}
          </div>
        </section>
      ))}
    </aside>
  );
}

function StatusBar({
  analysis,
  persistenceStatus
}: {
  analysis: ReturnType<typeof analyzeDocument>;
  persistenceStatus: "loading" | "api" | "sqlite" | "local";
}) {
  return (
    <footer className="status-bar">
      <span>{analysis.stats.lineCount} lines</span>
      <span>{analysis.stats.wordCount} words</span>
      <span>{analysis.stats.averageSyllables} avg syllables / line</span>
      <span>{analysis.stats.rhymeDensity}% rhyme density</span>
      <span>
        {persistenceStatus === "api"
          ? "Saved to SQLite"
          : persistenceStatus === "sqlite"
            ? "Saved to Android SQLite"
          : persistenceStatus === "local"
            ? "Saved in browser"
            : "Loading saved rhymes"}
      </span>
    </footer>
  );
}
