# Changelog

## Unreleased

- Updated the locked `qs` transitive dependency to address a moderate denial-of-service advisory reported by `npm audit`.

## 2026-05-13

- Fixed Android note persistence after app close/reopen by merging local and native SQLite documents by latest edit time, serializing native saves, and flushing on app hide/pagehide.
- Fixed mobile and Android dictionary behavior so tapping a word opens a compact bottom sheet with a visible close button.
- Reduced dictionary screen coverage on phone-sized layouts and hid the full dictionary panel on mobile to avoid duplicate dictionary surfaces.
- Fixed cursor alignment by keeping the textarea as the visible typing layer while rhyme highlights, syllable badges, endings, and line totals render as annotations.
- Updated Playwright coverage for textarea-driven word selection and mobile dictionary close behavior.
