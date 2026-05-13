# Project Edit Backups

| Date | Edited file | Backup file | Summary |
| --- | --- | --- | --- |
| 2026-05-13 | Initial scaffold | Not applicable | Created the greenfield RhymePad project files in an empty folder. |
| 2026-05-13 | package.json | backups/20260513-0800/package.json.bak | Added Node type definitions for Playwright/Node config typing. |
| 2026-05-13 | vite.config.ts | backups/20260513-0800/vite.config.ts.bak | Limited Vitest collection to unit tests under src so Playwright specs run only through Playwright. |
| 2026-05-13 | project-edit-backups.md | backups/20260513-0800/project-edit-backups.md.bak | Logged verification-driven config edits. |
| 2026-05-13 | src/styles.css | backups/20260513-0803/styles.css.bak | Moved analyzed word buttons above the transparent textarea so dictionary clicks work. |
| 2026-05-13 | project-edit-backups.md | backups/20260513-0803/project-edit-backups.md.bak | Logged the editor layering fix. |
| 2026-05-13 | tests/rhymepad.spec.ts | backups/20260513-0805/rhymepad.spec.ts.bak | Scoped dictionary text assertions to avoid matching the prompt menu. |
| 2026-05-13 | project-edit-backups.md | backups/20260513-0805/project-edit-backups.md.bak | Logged the Playwright selector fix. |
| 2026-05-13 | src/styles.css | backups/20260513-0808/styles.css.bak | Tightened and wrapped the prompt toolbar to avoid clipped command labels in desktop screenshots. |
| 2026-05-13 | project-edit-backups.md | backups/20260513-0808/project-edit-backups.md.bak | Logged toolbar visual polish. |
| 2026-05-13 | src/App.tsx | backups/20260513-words-popover/App.tsx.bak | Added a floating rhyming dictionary popover on word click and made word pointer selection more robust. |
| 2026-05-13 | src/styles.css | backups/20260513-words-popover/styles.css.bak | Styled the inline dictionary popover for desktop and mobile layouts. |
| 2026-05-13 | tests/rhymepad.spec.ts | backups/20260513-words-popover/rhymepad.spec.ts.bak | Added browser coverage for the word-click dictionary popover. |
| 2026-05-13 | project-edit-backups.md | backups/20260513-words-popover/project-edit-backups.md.bak | Logged the word-click dictionary fix. |
| 2026-05-13 | tests/rhymepad.spec.ts | backups/20260513-popover-tests/rhymepad.spec.ts.bak | Scoped dictionary assertions after adding the inline popover. |
| 2026-05-13 | tests/readme-screenshots.spec.ts | backups/20260513-popover-tests/readme-screenshots.spec.ts.bak | Verified README screenshots wait for the new word-click popover. |
| 2026-05-13 | project-edit-backups.md | backups/20260513-popover-tests/project-edit-backups.md.bak | Logged popover test selector fixes. |
| 2026-05-13 | package.json | backups/20260513-cmudict-sqlite/package.json.bak | Added CMUdict, Express, sql.js, and server scripts for the full dictionary and SQLite persistence. |
| 2026-05-13 | package-lock.json | backups/20260513-cmudict-sqlite/package-lock.json.bak | Updated dependency lockfile for CMUdict and SQLite server dependencies. |
| 2026-05-13 | Dockerfile | backups/20260513-cmudict-sqlite/Dockerfile.bak | Switched the container from static nginx to Node/Express serving the app and API. |
| 2026-05-13 | docker-compose.yml | backups/20260513-cmudict-sqlite/docker-compose.yml.bak | Added a named Docker volume for persisted SQLite data. |
| 2026-05-13 | src/App.tsx | backups/20260513-cmudict-sqlite/App.tsx.bak | Wired document load/save status through the new persistence API with local fallback. |
| 2026-05-13 | src/lib/storage.ts | backups/20260513-cmudict-sqlite/storage.ts.bak | Added API-backed load and save helpers with browser storage fallback. |
| 2026-05-13 | src/lib/analysis/phonetics.ts | backups/20260513-cmudict-sqlite/phonetics.ts.bak | Replaced the tiny starter dictionary search with the full CMU Pronouncing Dictionary package. |
| 2026-05-13 | src/lib/analysis/types.ts | backups/20260513-cmudict-sqlite/types.ts.bak | Added rhyme suggestion scoring metadata. |
| 2026-05-13 | src/lib/analysis/analyze.test.ts | backups/20260513-cmudict-sqlite/analyze.test.ts.bak | Added broader dictionary coverage tests. |
| 2026-05-13 | server/index.mjs | backups/20260513-cmudict-sqlite/server.index.mjs.bak | Added and corrected the Express SQLite persistence server. |
| 2026-05-13 | project-edit-backups.md | backups/20260513-cmudict-sqlite/project-edit-backups.md.bak | Logged the CMUdict and SQLite persistence implementation. |
| 2026-05-13 | server/index.mjs | backups/20260513-cmudict-sqlite/server.index.before-listener-retain.mjs.bak | Retained the HTTP server reference and persisted SQLite on shutdown. |
| 2026-05-13 | project-edit-backups.md | backups/20260513-cmudict-sqlite/project-edit-backups.before-listener-retain.bak | Logged server lifecycle hardening. |
| 2026-05-13 | README.md | backups/20260513-github-merge/README.conflict.bak | Resolved GitHub remote README merge conflict by keeping the full local README content. |
| 2026-05-13 | project-edit-backups.md | backups/20260513-github-merge/project-edit-backups.bak | Logged GitHub merge conflict resolution. |
