# Contributing to Blocopy

Thank you for contributing to Blocopy! Please follow these guidelines when submitting changes.

## Engineering Rules

1. **English Only**: All source code, comments, identifiers, tests, documentation, and commit messages must be in English.
2. **Zero Hardcoded Magic Values**: Numbers, durations, limits, and CSS selectors must live in `src/shared/config/`.
3. **No innerHTML Parsing**: All DOM elements in the sanitizer are created via `document.createElement`.
4. **Pure Logic & Ports**: Algorithms are pure functions that take inputs and return values without touching globals. Side effects communicate solely through port interfaces.

## Running Verification Checks

Run the verification pipeline before submitting any PR:

```bash
# Typecheck, lint, test, i18n, build, size budgets, and extension linting
npm run verify
```

Individual checks:
- `npm run lint` — ESLint strict type-checked preset
- `npm run typecheck` — TypeScript compiler checks (`tsc --noEmit`)
- `npm test` — Vitest unit test suite
- `npm run check:i18n` — Localization and string literal auditing
- `npm run check:size` — Budget limits enforcement

## Manual Testing With Fixture Pages

Static test fixtures are provided in `test/fixtures/` to validate browser behavior under diverse DOM scenarios:
- `article.html`: Headings, paragraphs, blockquotes, code blocks, lists.
- `chat.html`: Repeated message bubbles testing container detection.
- `nested-lists.html`: Three levels of deeply nested ordered and unordered lists.
- `table.html`: Table data cells (should not be selectable).
- `shadow-dom.html`: Open shadow root handling via `composedPath()`.
- `iframe.html`: Same-origin iframe isolation.
- `links.html`: Hyperlinks (plain click inside container toggles exclusion, Ctrl/Cmd+click opens link).
- `forms.html`: Form controls (inputs, textareas, buttons are never intercepted).

To test manually in Firefox:
```bash
npm run dev
```
Open each fixture in Firefox to ensure expected selection, exclusion, expansion, and copying.

## Adding Translation Overrides

Automated translations are produced at build time using the translation script (`scripts/translate-locales.mjs`). To correct or refine a machine translation:
1. Create or edit `scripts/translation-overrides/<locale>.json` (for example `scripts/translation-overrides/fr.json`).
2. Add the localized key-value pairs matching `_locales/en/messages.json`.
3. Human overrides are automatically merged over generated files and will never be overwritten.
