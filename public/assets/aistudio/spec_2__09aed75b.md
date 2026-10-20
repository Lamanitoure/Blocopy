# Blocopy — Implementation Specification

> Double-click to select and copy a whole block of text. Click a paragraph to leave it out.

- **Name:** Blocopy (exact spelling, never translated)
- **Target:** Firefox desktop, Manifest V3. Chrome/Edge are a later step and out of scope now.
- **Language of everything** (code, comments, identifiers, commit messages, docs, UI source strings): **English**. Other languages are produced by automatic translation (section 11).

---

## 1. Instructions for the coding agent (read first, obey strictly)

You work with limited capacity per session. Follow this protocol exactly.

1. Read sections 1 to 7 fully before writing any code. Before each phase, re-read that phase (section 13) and every section it references.
2. Work on **one phase at a time**, **one task at a time**, in order. Do not start the next phase until the current phase's *Definition of Done* is met.
3. After every task run the checks that exist at that point (`npm run lint`, `npm run typecheck`, `npm test`). After the last task of a phase run `npm run verify`. A task is not done while any check fails.
4. Never make a check pass by weakening it: no `any`, no `@ts-ignore`, no `eslint-disable`, no lowered thresholds, no skipped tests.
5. Do not add features, dependencies, files, permissions or options that are not in this document. If you believe one is needed, write it in `docs/OPEN_QUESTIONS.md` and stop.
6. If a requirement is ambiguous, impossible, or collides with a browser limitation: **do not invent a workaround**. Write the problem in `docs/OPEN_QUESTIONS.md` (what, why, two options) and stop to ask the owner.
7. Never claim you ran something you did not run. You probably cannot run Firefox. Behavior that needs a real browser is validated by the owner with the checklist in section 15; say so in your report.
8. Write tests **before** the implementation for every pure module (phase 2).
9. Commit after each task: `type(scope): summary` with type in `feat | fix | test | chore | docs | refactor`. One logical change per commit.
10. Keep your context small: use targeted edits instead of rewriting files, do not paste whole files in chat, re-read only the section you need.
11. If you are unsure about a browser API (support or behavior), check MDN. With no web access, use the assumptions in section 4 and record them in `docs/SPIKE.md`.
12. End of each phase: send a short report: files created/changed, commands run with pass/fail, deviations from this spec (should be none), open questions.

---

## 2. Product behavior (source of truth)

### 2.1 Definitions

- **Unit:** a *leaf block element*, i.e. an element matching `UNIT_SELECTOR` (section 7) that contains no other element matching it. Examples: `p`, a `li` without nested lists, `h2`, `pre`, `blockquote` without nested units.
- **Container:** an element that holds one or more units and is the thing Blocopy selects as a whole (a message, an article body, a comment).
- **Level:** one candidate container. Levels are ordered from smallest to largest. Level 0 is the smallest.
- **Session:** the period during which a container is selected. It holds: the list of levels, the current level index, and the set of excluded units.
- **Excluded unit:** a unit the user clicked to leave out of the selection.

### 2.2 Gestures

| Gesture | When idle | During a session |
|---|---|---|
| Double-click on eligible text | Start a session at level 0, highlight, copy. | Inside the container: go up one level (this clears exclusions). Outside it: start a new session on the new target. |
| Plain left click on a unit inside the container | Normal behavior. | Toggle that unit's exclusion, re-render, copy again. |
| Plain left click outside the container | Normal behavior. | End the session. The click goes through untouched. |
| `Escape` | Nothing. | Go down one level. At level 0: cancel the session (clear highlight, **clipboard unchanged**). |
| Alt + double-click | Native behavior. | Native behavior. Never intercepted. |
| Ctrl/Cmd/Shift + click, middle click, right click | Normal. | Normal. Never intercepted (so links can still be opened). |

Notes:
- The browser fires `click` (detail 1), `click` (detail 2), then `dblclick`. During a session, the first click of a double-click toggles a unit. The following `expand` action **clears all exclusions**, which cancels that accidental toggle. This is intended; cover it with a test.
- The native word selection flashing for one frame on the very first double-click is accepted in v1. Blocopy clears the native selection when it starts a session.
- Only `click` events with `detail === 1` and `button === 0` and no modifier key may toggle a unit.

### 2.3 Never intercept (guard rules)

Blocopy must do nothing, and leave the native behavior untouched, when any of these is true:

- `event.isTrusted` is `false` (synthetic event from a page script).
- The Alt key is pressed.
- The site is disabled by the user (section 10.3), or settings are not loaded yet.
- The target (after resolving shadow DOM) is inside: `input, textarea, select, button, a, summary, video, audio, canvas, iframe, object, embed, [contenteditable]` (the list lives in `INTERACTIVE_SELECTOR`, section 7).
- No unit can be found at or above the target.
- No level can be computed (section 8.2 returns an empty list).

### 2.4 Copy output

On session start, expand, shrink and every toggle, Blocopy writes **one clipboard item with two representations**:

- `text/html`: the sanitized, cleaned clone of the container minus excluded units (sections 8.3 and 8.4). Keeps headings, lists, bold/italic, links, code, tables.
- `text/plain`: a readable plain version (section 8.5).

Pasting uses the **native** paste of the user's system. Blocopy never reads the clipboard and never handles paste.

If every unit is excluded, do not write to the clipboard; show the "nothing left" toast.

---

## 3. Non-negotiable engineering rules

Each rule says how it is enforced. If a rule cannot be enforced as written, follow section 1 rule 6.

### R1 — English only
All code, comments, identifiers, docs and commit messages are in English. All user-visible text goes through i18n (section 11) with English as source. No user-visible string literal anywhere in `src/`, enforced by the i18n check script (section 11.5).

### R2 — Nothing hardcoded
- Numbers, selectors, storage keys, durations, limits, names and policy lists live **only** in `src/shared/config/` (section 7).
- Colors use CSS system colors (`Highlight`, `HighlightText`, `Canvas`, `CanvasText`) and CSS custom properties, never hex literals.
- Enforced by ESLint `no-magic-numbers` (allowed: `0`, `1`, `-1`) outside `src/shared/config/` and test files.

### R3 — No god objects, no hacks
- One responsibility per module. Pure logic is separated from DOM side effects. Side effects are reached through small interfaces ("ports") injected into the controller.
- Enforced by ESLint: `max-lines` 200 per file, `max-lines-per-function` 40, `complexity` 10, `max-depth` 3, `max-params` 4.
- No global mutable state except inside the one composition root. No singletons that other modules import to reach state. No `setTimeout`-based timing hacks to "make it work".

### R4 — Nothing obsolete
- Forbidden: `document.execCommand`, `var`, `XMLHttpRequest`, `window.event`, jQuery or any DOM library, `webextension-polyfill` (Firefox-first, native `browser.*`), Manifest V2, background pages, `eval`, `new Function`, string timers.
- Use: ES2022, ES modules, `async/await`, `AbortController` for listener cleanup, the async Clipboard API (`navigator.clipboard.write` with `ClipboardItem`), `TreeWalker`, `Element.closest`, `composedPath()`.
- Enforced by ESLint (`no-var`, `no-eval`, `no-implied-eval`, `no-new-func`, `no-restricted-properties` for `document.execCommand` and `document.write`).

### R5 — Secure
See section 14. Summary: minimal permissions, no network at runtime, no remote code, strict CSP, allowlist sanitizer, no `innerHTML` assignment, ignore untrusted events, isolate injected UI in a closed shadow root.

### R6 — Light
- Zero runtime dependencies.
- Size budgets (section 5.3) checked by `npm run check:size`.
- No `MutationObserver` on the page. No work at idle: listeners do nothing until an event occurs. Session listeners are added only while a session is active and removed at its end.

### R7 — Fluid and accessible
- Selection and copy complete in under 50 ms for a typical article (hundreds of paragraphs). No synchronous layout loops: no reading layout properties inside loops; no `getComputedStyle` over many nodes.
- Highlight is drawn without mutating the page DOM when possible (section 10.1).
- Toast animates `opacity` and `transform` only, and honors `prefers-reduced-motion`. Toast has `role="status"`. Popup is fully keyboard operable. RTL languages work (section 11.4).

---

## 4. Platform assumptions to verify (record results in `docs/SPIKE.md`)

| # | Assumption | If false |
|---|---|---|
| A1 | `strict_min_version` of **140.0** gives: CSS Custom Highlight API, `ClipboardItem` write, MV3 content scripts. Verify on MDN browser-compat data and set the **lowest** version that supports every API used. | Raise the minimum version. |
| A2 | `new Highlight(...)` and `CSS.highlights` work from a Firefox content script, and `::highlight(name)` rules from a content-script-injected stylesheet apply to the page. | Use the overlay highlighter (section 10.1). |
| A3 | `navigator.clipboard.write([ClipboardItem])` works in a content script during a user gesture **without** the `clipboardWrite` permission. | Add `clipboardWrite` and document why in the README. |
| A4 | After install, the content script runs on pages without any extra permission grant from the user. | Document the grant step in the README and stop for owner input. |
| A5 | The manifest key `browser_specific_settings.gecko.data_collection_permissions` is accepted by `web-ext lint`. | Follow current AMO documentation; record the change. |

---

## 5. Tooling and dependencies

### 5.1 Stack
- Node.js: current Active LTS. Record in `.nvmrc` and `package.json` `engines`.
- TypeScript with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `verbatimModuleSyntax`. Target `ES2022`, `module` `ESNext`, `moduleResolution` `Bundler`, `lib` `["ES2022", "DOM", "DOM.Iterable"]`.
- Bundler: **esbuild** (script `scripts/build.mjs`, no config framework). Content script bundle format `iife`, minified in production, with sourcemap only in dev.
- CSS imported as text via esbuild loader `.css=text` (used by the toast).
- Lint: **ESLint** flat config with `typescript-eslint` (strict type-checked preset) plus the rules in section 3.
- Tests: **Vitest** with `jsdom` environment.
- Extension tooling: **web-ext** (`run`, `lint`, `build`).
- Browser types: `@types/firefox-webext-browser`.

### 5.2 Allowed dependencies (dev only, latest stable, exact versions in the lockfile)
`typescript`, `esbuild`, `eslint`, `typescript-eslint`, `vitest`, `jsdom`, `web-ext`, `@types/firefox-webext-browser`, `@types/node`. **Nothing else.** Runtime dependencies: none. Run `npm audit` at the end of every phase and report the result.

### 5.3 Size budgets (`budgets.json`, checked by `scripts/check-size.mjs`)
- `dist/content.js` ≤ 20 KB minified and ≤ 8 KB gzipped.
- `dist/popup.js` ≤ 6 KB minified.
- Zipped package excluding `_locales` ≤ 60 KB.
Budgets are data in `budgets.json`, not constants in the script.

### 5.4 npm scripts (exact names)

| Script | Does |
|---|---|
| `build` | Production build into `dist/`. |
| `dev` | Watch build and `web-ext run --source-dir dist` (Firefox). |
| `lint` | ESLint on `src`, `scripts`, `test`. |
| `typecheck` | `tsc --noEmit`. |
| `test` | Vitest, single run. |
| `check:i18n` | Section 11.5. |
| `check:size` | Section 5.3. |
| `lint:ext` | `web-ext lint --source-dir dist`. |
| `translate` | Section 11.3. Manual, not part of `verify`. |
| `package` | `web-ext build` to `artifacts/`. |
| `verify` | `lint`, `typecheck`, `test`, `check:i18n`, `build`, `check:size`, `lint:ext`, in that order, stop on first failure. |

---

## 6. Repository layout (create exactly this; add nothing else)

```
blocopy/
├─ _locales/
│  └─ en/messages.json
├─ docs/
│  ├─ SPIKE.md
│  └─ OPEN_QUESTIONS.md
├─ scripts/
│  ├─ build.mjs
│  ├─ check-size.mjs
│  ├─ check-i18n.mjs
│  ├─ translate-locales.mjs
│  ├─ locales.config.json          # target locales + MT codes + do-not-translate keys
│  └─ translation-overrides/       # optional human fixes, never overwritten
├─ src/
│  ├─ content/
│  │  ├─ index.ts                  # composition root: wires modules, contains no logic
│  │  ├─ content.css               # only the ::highlight rule
│  │  ├─ session/
│  │  │  ├─ session-state.ts       # types + pure reducer
│  │  │  ├─ session-controller.ts  # applies actions, calls ports
│  │  │  └─ ports.ts               # Highlighter, ClipboardPort, Notifier interfaces
│  │  ├─ dom/
│  │  │  ├─ target.ts              # resolveTarget(event) with composedPath
│  │  │  ├─ eligibility.ts         # guard rules of section 2.3
│  │  │  ├─ units.ts               # unit helpers
│  │  │  ├─ bounded.ts             # bounded counters (TreeWalker with early exit)
│  │  │  ├─ level-finder.ts        # section 8.2
│  │  │  ├─ paths.ts               # getPath / resolvePath
│  │  │  └─ ranges.ts              # section 8.6
│  │  ├─ clipboard/
│  │  │  ├─ build-fragment.ts      # section 8.3
│  │  │  ├─ sanitize.ts            # section 8.4
│  │  │  ├─ serialize-html.ts      # only file allowed to read innerHTML
│  │  │  ├─ plain-text.ts          # section 8.5
│  │  │  └─ clipboard-writer.ts    # section 8.7
│  │  ├─ highlight/
│  │  │  ├─ css-highlighter.ts
│  │  │  └─ overlay-highlighter.ts # only if the spike requires it
│  │  ├─ ui/
│  │  │  ├─ toast.ts
│  │  │  └─ toast.css
│  │  ├─ events/
│  │  │  └─ listeners.ts           # attach/detach groups via AbortController
│  │  └─ settings/
│  │     └─ site-settings.ts
│  ├─ popup/
│  │  ├─ popup.html
│  │  ├─ popup.ts
│  │  └─ popup.css
│  ├─ shared/
│  │  ├─ config/
│  │  │  ├─ limits.ts
│  │  │  ├─ selectors.ts
│  │  │  ├─ storage-keys.ts
│  │  │  ├─ sanitize-policy.ts
│  │  │  └─ ui.ts
│  │  ├─ i18n.ts
│  │  └─ types.ts
│  └─ manifest.template.json
├─ test/
│  ├─ unit/                        # mirrors src/ paths
│  └─ fixtures/                    # static HTML pages for manual QA (section 15)
├─ budgets.json
├─ eslint.config.js
├─ tsconfig.json
├─ package.json
├─ .nvmrc  .gitignore  .editorconfig
├─ README.md  CONTRIBUTING.md  LICENSE
```

---

## 7. Configuration modules (all values live here)

Define as `export const` with `as const` where useful, each with a one-line comment.

**`limits.ts`**
- `MIN_UNITS_PER_CONTAINER = 2`
- `MAX_LEVELS = 4`
- `MAX_SELECTION_CHARS = 200_000`
- `REPEATED_SIBLINGS_THRESHOLD = 3`
- `MAX_TOAST_STACK = 1`

**`selectors.ts`**
- `UNIT_SELECTOR = 'p, li, h1, h2, h3, h4, h5, h6, blockquote, pre, dt, dd, figcaption'`
- `INTERACTIVE_SELECTOR` = the list in section 2.3
- `NON_CONTAINER_TAGS` = `UL, OL, DL, TABLE, THEAD, TBODY, TFOOT, TR`
- `HARD_STOP_TAGS` = `BODY, HTML`
- `PREFERRED_CONTAINER_SELECTOR = 'article, [role="article"], blockquote, details'`

**`storage-keys.ts`**
- `DISABLED_HOSTS_KEY = 'disabledHosts'`

**`sanitize-policy.ts`** — see section 8.4 for the exact content.

**`ui.ts`**
- `HIGHLIGHT_NAME = 'blocopy-selection'`
- `TOAST_DURATION_MS = 1200`
- `TOAST_HOST_TAG = 'blocopy-toast'`
- Mapping `NotificationKind` → i18n key (`copied`, `failed`, `empty`).

A unit test must assert that `content.css` contains `::highlight(${HIGHLIGHT_NAME})`.

---

## 8. Algorithms

All pure functions take their inputs as arguments and return values. They never read globals, never touch `window`, and never mutate the live page.

### 8.1 Units (`units.ts`)
- `isLeafUnit(el: Element): boolean` → `el.matches(UNIT_SELECTOR)` and `el.querySelector(UNIT_SELECTOR) === null`.
- `closestLeafUnit(from: Element, within: Element): Element | null` → `from.closest(UNIT_SELECTOR)`; return it only if it is a leaf unit and `within.contains(it)`; otherwise `null`.
- `listLeafUnits(root: Element): Element[]` → all `root.querySelectorAll(UNIT_SELECTOR)` filtered by `isLeafUnit`, in document order.

### 8.2 Level finding (`level-finder.ts`)

`findLevels(target: Element): Element[]` returns up to `MAX_LEVELS` containers, smallest first, or `[]`.

1. `start = closestLeafUnit(target, document.body)`. If `null`, return `[]`.
2. Walk `node` upward starting at `start.parentElement`. Stop when `node` is `null` or its tag is in `HARD_STOP_TAGS`.
3. For each `node`, in this order:
   a. **Repeated-item rule.** Let `child` be the previous node of the climb (the child of `node` on the path to `start`; for the first step, `start`). If `node` has at least `REPEATED_SIBLINGS_THRESHOLD` element children that share `child`'s `tagName` and `className`, then `child` is a repeated item (a chat message, a comment, a result). Add `child` as a level if it is not already the last level, then **stop climbing** (do not go above a repeated list).
   b. If `node.tagName` is in `NON_CONTAINER_TAGS`, continue climbing.
   c. If the text budget is exceeded (`exceedsTextBudget(node, MAX_SELECTION_CHARS)`), stop climbing.
   d. If `hasAtLeast(node, UNIT_SELECTOR, MIN_UNITS_PER_CONTAINER)` or `node.matches(PREFERRED_CONTAINER_SELECTOR)`, add `node` as a level.
   e. If `levels.length === MAX_LEVELS`, stop.
4. Return the levels (deduplicated, each strictly containing the previous one).

`bounded.ts` provides `hasAtLeast(root, selector, n)` and `exceedsTextBudget(root, max)`, both using a `TreeWalker` that **exits early**. Never call `querySelectorAll(...).length` on a large subtree for these checks.

Required behavior (each is a unit test):
1. Article with 3 paragraphs → click the 2nd → level 0 is the article.
2. List of 5 `div.message`, each with one `p` → click in one → level 0 is that message and it is the only level.
3. Message with `p`, `ul`, `p` → click inside an `li` → level 0 is the message div, not the `ul`.
4. Only a `ul` of 3 items inside a `div` → level 0 is the `div`.
5. Click inside a `table` cell → `[]` (no unit).
6. Page text above the budget → the oversized ancestor is never returned.
7. Nested containers produce strictly growing levels, never more than `MAX_LEVELS`.
8. Target inside `body` directly with a single paragraph and no container → `[]`.

### 8.3 Fragment building (`build-fragment.ts`)

`buildFragment(container: Element, excluded: readonly Element[]): DocumentFragment`

1. Compute `paths = excluded.map(e => getPath(container, e))` (`paths.ts`: array of `childNodes` indexes from `container` down to the node; `resolvePath` is the inverse).
2. `clone = container.cloneNode(true)`.
3. Resolve each path **in the clone**, in reverse document order (so indexes stay valid), and remove the node.
4. Prune: remove elements that became empty (no text and no `img`) and whose tag is in `NON_CONTAINER_TAGS` or matches `UNIT_SELECTOR`; repeat upward until stable.
5. Return the clone's children wrapped in a `DocumentFragment` (the clone itself is never inserted into the page).

The live page DOM is **never** modified.

### 8.4 Sanitizer (`sanitize.ts`, `serialize-html.ts`, `config/sanitize-policy.ts`)

Allowlist, built by creating **new** nodes. Never parse HTML strings, never assign `innerHTML`.

`sanitize-policy.ts` exports:
- `ALLOWED_TAGS`: `a abbr b blockquote br code dd del div dl dt em figcaption figure h1 h2 h3 h4 h5 h6 hr i img ins kbd li mark ol p pre q s small span strong sub sup table tbody td tfoot th thead tr u ul`
- `ALLOWED_ATTRIBUTES` per tag: `a: [href, title]`, `img: [src, alt, width, height]`, `td: [colspan, rowspan]`, `th: [colspan, rowspan, scope]`, `ol: [start]`. No other attributes anywhere (no `class`, `id`, `style`, `on*`, `data-*`).
- `ALLOWED_URL_PROTOCOLS`: `http:`, `https:`, `mailto:`, `tel:` for `href`; `http:`, `https:` for `img src`.
- `DROP_WITH_CONTENT_SELECTOR`: `script, style, noscript, template, iframe, object, embed, svg, math, form, input, button, select, textarea, link, meta, base, canvas, audio, video, [hidden], [aria-hidden="true"]`.

Rules:
1. Element matching `DROP_WITH_CONTENT_SELECTOR` → dropped with all its content.
2. Element not in `ALLOWED_TAGS` → **unwrapped** (its sanitized children are kept).
3. Allowed element → recreated with `document.createElement`, only allowed attributes copied.
4. URL attributes are resolved with `new URL(value, baseURI)`; if parsing fails or the protocol is not allowed, the attribute is dropped (for `a`, the element is unwrapped; for `img`, the element is dropped).
5. Text nodes are copied as text nodes. Comments and processing instructions are dropped.
6. `serialize-html.ts` puts the sanitized fragment in a detached `div` and returns `div.innerHTML` (read only). It is the **only** file allowed to read `innerHTML`.

Unit tests (each one): `<script>` removed with content; `onclick` removed; `javascript:` link unwrapped; `data:` image dropped; unknown tag unwrapped keeping text; `style`/`class`/`id` attributes removed; `[hidden]` and `[aria-hidden="true"]` subtrees dropped; `svg` and `iframe` dropped; relative link made absolute; nested allowed tags preserved; output of a sanitized tree is stable when sanitized again (idempotent).

### 8.5 Plain text (`plain-text.ts`)

`toPlainText(fragment: DocumentFragment): string`

- Block elements are separated by one blank line (`\n\n`). List items by one newline.
- `ul > li` → `- text`. `ol > li` → `n. text`, starting at the `start` attribute (default 1). Each nesting depth adds two spaces of indentation.
- `br` → `\n`. `pre` content is preserved exactly.
- Outside `pre`, runs of whitespace collapse to a single space; lines are trimmed.
- Links → their text only. Images → nothing.
- Collapse three or more newlines to two; trim the final result.

Unit tests:
- `<p>One</p><p>Two</p>` → `One\n\nTwo`
- `<ul><li>A</li><li>B</li></ul>` → `- A\n- B`
- `<ol start="3"><li>A</li><li>B</li></ol>` → `3. A\n4. B`
- `<p>A<br>B</p>` → `A\nB`
- `<p>  a \n  b </p>` → `a b`
- nested list indentation of two spaces
- `<pre>  x\n y</pre>` unchanged

### 8.6 Ranges for highlighting (`ranges.ts`)

`computeRanges(container: Element, excluded: readonly Element[]): Range[]`

- No exclusions → one range: `selectNodeContents(container)`.
- Otherwise sort `excluded` by `compareDocumentPosition`. Start with the boundary `(container, 0)`. For each excluded element `e`: create a range from the current boundary to `setEndBefore(e)`; keep it if not collapsed; move the boundary to just after `e` (`setStartAfter(e)`). Finally create the last range from the boundary to `(container, container.childNodes.length)`.

### 8.7 Clipboard write (`clipboard-writer.ts`)

```ts
export interface ClipboardPayload { readonly html: string; readonly text: string; }
```
1. Build one `ClipboardItem` with two `Blob`s: `text/html` and `text/plain`.
2. `await navigator.clipboard.write([item])`.
3. On failure: try `navigator.clipboard.writeText(payload.text)`. If that also fails, **throw** so the controller shows the "failed" toast.
4. Never call `document.execCommand`.

---

## 9. Session state machine and controller

### 9.1 Pure reducer (`session-state.ts`)

```ts
export type SessionState =
  | { readonly kind: 'idle' }
  | {
      readonly kind: 'active';
      readonly levels: readonly Element[];
      readonly levelIndex: number;
      readonly excluded: ReadonlySet<Element>;
    };

export type SessionAction =
  | { readonly type: 'start'; readonly levels: readonly Element[] }
  | { readonly type: 'expand' }
  | { readonly type: 'back' }                       // Escape
  | { readonly type: 'toggle'; readonly unit: Element }
  | { readonly type: 'end' };

export function reduce(state: SessionState, action: SessionAction): SessionState;
```

Transition rules (each is a unit test):
- `start` from any state → `active`, `levelIndex 0`, empty `excluded`. Ignored if `levels` is empty.
- `expand` when `active` and `levelIndex < levels.length - 1` → `levelIndex + 1`, `excluded` cleared. At the last level → state unchanged.
- `back` when `active` and `levelIndex > 0` → `levelIndex - 1`, `excluded` cleared. At level 0 → `idle`.
- `toggle` when `active` → add the unit if absent, remove if present. Ignored if the unit is not inside the current level element.
- `end` → `idle`.
- Any action on `idle` other than `start` → unchanged. The reducer never mutates its input.

### 9.2 Ports (`ports.ts`)

```ts
export interface Highlighter { show(ranges: readonly Range[]): void; clear(): void; }
export interface ClipboardPort { write(payload: ClipboardPayload): Promise<void>; }
export type NotificationKind = 'copied' | 'failed' | 'empty';
export interface Notifier { notify(kind: NotificationKind): void; }
```

### 9.3 Controller (`session-controller.ts`)

Constructor receives: `Highlighter`, `ClipboardPort`, `Notifier`, and a `listeners` helper. It owns the current `SessionState`.

`dispatch(action)`:
1. `next = reduce(state, action)`; if `next === state`, return.
2. Replace the state.
3. If `next.kind === 'idle'` → `highlighter.clear()`, remove session listeners, return.
4. If the current container is no longer connected (`!container.isConnected`) → dispatch `end`.
5. Compute ranges (8.6) → `highlighter.show(ranges)`.
6. If every unit of the container is excluded → `notifier.notify('empty')`, return (clipboard untouched).
7. Build fragment (8.3) → sanitize + serialize (8.4) → plain text (8.5) → `clipboard.write(...)`. On success `notify('copied')`; on error `notify('failed')`.

Session listeners are attached on the first `active` state and detached on `idle`, via **one** `AbortController` per session:
- `click` (capture) on `document`: rules of section 2.2. When toggling a unit, call `preventDefault()` and `stopPropagation()`. In every other case do not touch the event.
- `mousedown` (capture): if `detail > 1` and the target is inside the container, `preventDefault()` (avoids native word selection flicker).
- `keydown` (capture): on `Escape` dispatch `back`. Do **not** call `preventDefault()` or `stopPropagation()`.

The `dblclick` listener is permanent (added in `index.ts`) and applies the guard rules (2.3) then dispatches `start` or `expand`, then clears the native selection with `getSelection()?.removeAllRanges()`.

`index.ts` only: reads settings, creates the adapters, creates the controller, registers the permanent `dblclick` listener, subscribes to settings changes (a site becoming disabled dispatches `end`). **No logic in `index.ts`.**

---

## 10. UI

### 10.1 Highlight
- Preferred: `css-highlighter.ts` using `CSS.highlights` and `Highlight` with `HIGHLIGHT_NAME`. `content.css` contains only:
  ```css
  ::highlight(blocopy-selection) { background-color: Highlight; color: HighlightText; }
  ```
  (system colors give a native look, dark mode and high-contrast support for free; use the name from `ui.ts`).
- Fallback, only if the spike (A2) fails: `overlay-highlighter.ts` draws semi-transparent boxes from `range.getClientRects()` inside a closed shadow root with `pointer-events: none`, `position: fixed`, updated through one `requestAnimationFrame` loop on `scroll` and `resize` (passive listeners), removed on `clear()`.
- Choose the implementation in `index.ts` by feature detection of the spike result, never by user-agent sniffing.

### 10.2 Toast (`toast.ts`, `toast.css`)
- One host element (`TOAST_HOST_TAG`) appended to `document.documentElement`, with a **closed** shadow root. Reuse the host for later toasts; never stack more than `MAX_TOAST_STACK`.
- Text is set with `textContent` from `t(key)`. The element has `role="status"`.
- Style: bottom-right, `Canvas` background, `CanvasText` color, `color-scheme: light dark`, fade/slide with CSS transitions on `opacity` and `transform` only, disabled under `@media (prefers-reduced-motion: reduce)`.
- Hide after `TOAST_DURATION_MS`. Set `dir` from `t('@@bidi_dir')`.

### 10.3 Site settings and popup
- `site-settings.ts`: reads `DISABLED_HOSTS_KEY` from `browser.storage.local`, exposes `isEnabled(hostname)`, and subscribes to `browser.storage.onChanged`. Until the first read completes, the extension behaves as disabled.
- Per-frame behavior: the toggle uses the frame's own `location.hostname`. A cross-origin iframe is enabled unless its own host is listed. Document this in the README.
- Popup (`popup.html/ts/css`, no framework): shows the heading, one checkbox "Enabled on `<hostname>`", and a hint about Alt + double-click. Reads the active tab with `browser.tabs.query({ active: true, currentWindow: true })` (allowed by `activeTab`). For non-`http(s)` pages the checkbox is disabled and the "unsupported page" message is shown. The checkbox writes the host list in `storage.local`. No background script, no messaging.

---

## 11. i18n and automatic translation

### 11.1 Rules
- **English is the single source**: `_locales/en/messages.json`, `"default_locale": "en"`.
- Every user-visible string uses `t(key, substitutions?)` from `src/shared/i18n.ts`, a thin wrapper over `browser.i18n.getMessage`. If a key is missing, it throws in tests and returns the key in production.
- Other languages are **generated at build time by machine translation and committed**. There is **no network call at runtime** and no runtime translation API.

### 11.2 Message keys (create all of them in `en`, each with a `description` for translators)

| Key | English message |
|---|---|
| `extName` | `Blocopy` (never translated) |
| `extDescription` | `Double-click to select and copy a whole block of text. Click a paragraph to leave it out.` (≤ 132 characters) |
| `actionTitle` | `Blocopy` (never translated) |
| `toastCopied` | `Copied` |
| `toastCopyFailed` | `Could not copy` |
| `toastNothingLeft` | `Nothing left to copy` |
| `popupHeading` | `Blocopy on this site` |
| `popupToggleLabel` | `Enabled on $HOST$` (placeholder `host` → `$1`) |
| `popupUnsupportedPage` | `Blocopy cannot run on this page.` |
| `popupHint` | `Alt + double-click selects a single word.` |

### 11.3 Translation script (`scripts/translate-locales.mjs`, dev tool, Node `fetch`, no dependency)
- Reads `_locales/en/messages.json` and `scripts/locales.config.json`.
- `locales.config.json` contains: `locales` (initial list: `fr`, `es`, `pt_BR`, `de`, `it`, `ar`, `ru`, `zh_CN`, `ja`, `hi`, each with its machine-translation code), and `doNotTranslate: ["extName", "actionTitle"]`.
- Provider: a **LibreTranslate-compatible HTTP API** (free, open source, self-hostable). URL from env `BLOCOPY_MT_URL`, optional key from env `BLOCOPY_MT_API_KEY`. No URL or key in the repository. Request: `POST {url}/translate` with `{ q, source: "en", target, format: "text" }`; read `translatedText`.
- **Placeholders are protected:** split each message on the regex for `$NAME$` tokens, translate only the text segments, then reassemble.
- Copy `description` fields unchanged from English.
- After machine translation, merge `scripts/translation-overrides/<locale>.json` over the result (human fixes win and are never overwritten).
- Write `_locales/<locale>/messages.json`. Exit with a non-zero code if the provider fails or returns an empty string. Never write partial files.

### 11.4 RTL
Popup and toast set `dir` from `t('@@bidi_dir')`. No physical `left`/`right` CSS in popup or toast: use logical properties (`inset-inline-end`, `margin-inline-start`, `text-align: start`).

### 11.5 `check:i18n` (`scripts/check-i18n.mjs`)
Fail if any of these is true:
- A locale is missing a key that exists in `en`, or has an extra key.
- A message is empty.
- Placeholders differ from English.
- A `t('key')` call in `src/` uses a key not in `en`.
- A `__MSG_x__` reference in the manifest template uses a key not in `en`.
- A user-visible string literal is found in `src/` (heuristic: string arguments to `textContent`, `title`, `ariaLabel`, `placeholder` assignments that are not `t(...)` calls).

---

## 12. Manifest (`src/manifest.template.json`)

`scripts/build.mjs` fills in the version from `package.json` and writes `dist/manifest.json`. Never edit `dist/` by hand.

```json
{
  "manifest_version": 3,
  "name": "__MSG_extName__",
  "version": "0.0.0",
  "description": "__MSG_extDescription__",
  "default_locale": "en",
  "icons": { "48": "icons/icon.svg", "96": "icons/icon.svg" },
  "permissions": ["storage", "activeTab"],
  "action": {
    "default_title": "__MSG_actionTitle__",
    "default_popup": "popup.html",
    "default_icon": "icons/icon.svg"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_idle",
      "all_frames": true
    }
  ],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; base-uri 'none'"
  },
  "browser_specific_settings": {
    "gecko": {
      "id": "OWNER_SUPPLIED",
      "strict_min_version": "140.0",
      "data_collection_permissions": { "required": ["none"] }
    }
  }
}
```

Rules:
- Start with **no** `clipboardWrite` (assumption A3). Add it only if the owner's browser test shows copy failing, then document it.
- `"id"` stays `OWNER_SUPPLIED` until the owner provides the real value (section 17). The build must **fail** in release mode if it is still a placeholder.
- Create `icons/icon.svg`: one simple, original geometric icon (a rounded rectangle with three horizontal lines, one of them dimmed). No third-party artwork, no text in the icon.

---

## 13. Phases

### Phase 0 — Scaffold and tooling (no feature code)
1. Create `package.json`, `.nvmrc`, `.gitignore`, `.editorconfig`, `tsconfig.json`, `eslint.config.js` with every rule from section 3, `budgets.json`.
2. Create the folder tree of section 6 with **empty-but-valid** files only where a script needs them.
3. Write `scripts/build.mjs` (bundles `src/content/index.ts` to `dist/content.js`, `src/popup/popup.ts` to `dist/popup.js`, copies `popup.html`, `popup.css`, `content.css`, `_locales`, `icons`, writes the manifest).
4. Write `scripts/check-size.mjs`.
5. Add all npm scripts of section 5.4.
6. Add a trivial test so `npm test` has something to run.

**Done when:** `npm run verify` passes on the skeleton.

### Phase 1 — Feasibility spike
1. Build a throwaway extension in `docs/spike/` that, on double-click: (a) sets a `Highlight` on a paragraph and styles it with `::highlight()`; (b) writes an HTML + plain `ClipboardItem` with no `clipboardWrite` permission.
2. If you can run Firefox, run it and record results for A1 to A5 in `docs/SPIKE.md`.
3. If you cannot run Firefox: write exact manual steps and expected results in `docs/SPIKE.md`, **stop, and ask the owner** to run them and reply. Do not continue to phase 5 before the answer.
4. Record the decision: CSS highlighter or overlay highlighter; final `strict_min_version`; whether `clipboardWrite` is needed.

**Done when:** `docs/SPIKE.md` has a result and a decision for each assumption.

### Phase 2 — Pure logic, tests first
For each module below: write the tests listed in its section, see them fail, then implement.
1. `config/*` and `shared/types.ts`.
2. `dom/paths.ts`, `dom/bounded.ts`, `dom/units.ts`.
3. `dom/level-finder.ts` (tests: section 8.2, all eight).
4. `clipboard/build-fragment.ts`.
5. `clipboard/sanitize.ts` and `serialize-html.ts` (tests: section 8.4).
6. `clipboard/plain-text.ts` (tests: section 8.5).
7. `dom/ranges.ts` (assert range boundaries with jsdom).
8. `session/session-state.ts` reducer (tests: every rule in 9.1, plus the "first click of a double-click then expand leaves no exclusions" case).

**Done when:** `npm run verify` passes and every test listed above exists.

### Phase 3 — Controller, events, guards
1. `session/ports.ts` and `session/session-controller.ts`, tested with **fake ports** (no browser).
2. `dom/target.ts` (shadow DOM via `composedPath()[0]`, text nodes resolved to their parent element) and `dom/eligibility.ts` (every guard rule of 2.3, one test each).
3. `events/listeners.ts` (one `AbortController` per group).
4. `index.ts` wiring (no logic).

**Done when:** controller tests cover: start, expand, back at level 0, toggle, all-excluded path, container removed from the DOM, clipboard failure, site disabled mid-session.

### Phase 4 — Clipboard, toast, i18n runtime, settings
1. `clipboard/clipboard-writer.ts` with a test using a fake `navigator.clipboard`.
2. `shared/i18n.ts` and `_locales/en/messages.json` (all keys of 11.2).
3. `ui/toast.ts` and `toast.css`.
4. `settings/site-settings.ts` (fake `browser.storage`).

**Done when:** `verify` passes; `toast.ts` contains no string literal shown to users.

### Phase 5 — Highlighter
1. Implement the highlighter chosen in phase 1 (and only that one).
2. Add the `content.css` rule and the test that checks `HIGHLIGHT_NAME` consistency.

**Done when:** `verify` passes. Visual behavior is checked by the owner (section 15).

### Phase 6 — Popup
1. `popup.html`, `popup.ts`, `popup.css` per 10.3. All text through `t(...)`.

**Done when:** `verify` passes; popup works with keyboard only (owner check).

### Phase 7 — Automatic translation pipeline
1. `scripts/locales.config.json`, `scripts/translate-locales.mjs`, `scripts/check-i18n.mjs` per section 11.
2. Unit-test the placeholder-protection function and the override merge.
3. Run `npm run translate` **only if** `BLOCOPY_MT_URL` is set; otherwise skip and state that in the report.

**Done when:** `check:i18n` passes with the generated locales (or with `en` only if the owner has not provided a provider).

### Phase 8 — Hardening and docs
1. Walk through the security checklist (section 14) and tick every item in your report with the file that satisfies it.
2. Confirm size budgets and `npm audit`.
3. Write `README.md` (what it does, gestures table, install for development, limitations, privacy statement "no network access, no data collected, nothing leaves your device", architecture in 10 lines), `CONTRIBUTING.md` (how to add a locale override, run checks, fixture pages), and `LICENSE` (MIT, copyright holder from section 17).
4. `npm run package`.

**Done when:** `npm run verify` passes and `web-ext build` produces an archive.

### Phase 9 — Owner release checklist (owner only; the agent only drafts the text)
Replace `OWNER_SUPPLIED`, run the manual QA of section 15, add icon and screenshots, submit to AMO with a source-code statement (the project has no minification of third-party code; provide build instructions from the README).

---

## 14. Security checklist

- [ ] `permissions` contains only `storage` and `activeTab` (plus `clipboardWrite` only if proven necessary and documented).
- [ ] No `host_permissions` beyond the content script `matches`.
- [ ] No network calls in the shipped extension (search `dist/` for `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`: zero results).
- [ ] No remote code, no `eval`, no `new Function`, no string timers.
- [ ] Extension-page CSP as in section 12; no inline scripts or event-handler attributes in `popup.html`.
- [ ] No assignment to `innerHTML`, `outerHTML`, `insertAdjacentHTML`, no `document.write` (ESLint-enforced). The only `innerHTML` read is in `serialize-html.ts`.
- [ ] Clipboard HTML is produced only by the allowlist sanitizer (8.4).
- [ ] Only `event.isTrusted` events start or modify a session.
- [ ] The content script exposes no global, does not use `window.postMessage`, does not inject code in the page's own JavaScript context.
- [ ] Toast host uses a **closed** shadow root; page scripts cannot read or restyle it.
- [ ] Password fields, inputs and editable areas are never read or selected (guard rules).
- [ ] No analytics, no telemetry, no remote fonts or images.
- [ ] Dependencies pinned by lockfile; `npm audit` clean or each finding explained in the report.

---

## 15. Testing and manual QA

### 15.1 Automated
- Vitest + jsdom for all pure modules and the controller with fake ports.
- No test may depend on layout (`getClientRects`) or on the Highlight API; those live behind ports.

### 15.2 Fixture pages (`test/fixtures/*.html`, static, no scripts from the network)
1. `article.html` — article with headings, paragraphs, a list, a quote, a code block.
2. `chat.html` — 6 repeated message `div`s, some with one paragraph, some with `p + ul + p`.
3. `nested-lists.html` — ordered and unordered lists, three levels deep.
4. `table.html` — table with text cells (nothing should be selectable).
5. `shadow-dom.html` — open shadow root containing paragraphs.
6. `iframe.html` — same-origin iframe with an article.
7. `links.html` — block with links (click toggles; Ctrl+click opens the link).
8. `forms.html` — inputs and textareas (Blocopy must not interfere).

### 15.3 Manual checklist (owner, in Firefox via `npm run dev`)
For each fixture: double-click selects the expected block; a second double-click expands one level; `Escape` goes back then cancels; clicking a paragraph removes it from highlight and from the clipboard; pasting into a rich editor and into a plain text field keeps/loses layout as expected; Alt + double-click selects a word natively; toggling the site off in the popup disables everything immediately; language switch shows translated strings; keyboard-only popup use; dark mode toast.

---

## 16. Out of scope (do not build)

Paste handling or reading the clipboard; AI or any model; Markdown output and copy modes (architecture must allow them later through a small formatter interface, but do not implement them); options page; keyboard-only selection; word-level or drag-based exclusion; Chrome/Edge packaging; file multi-selection; any attempt to defeat sites that block copy or paste.

---

## 17. Owner-supplied values (never invent these)

- `gecko.id` (for example `blocopy@your-domain`)
- Copyright holder name for `LICENSE` and `package.json` `author`
- Machine-translation endpoint `BLOCOPY_MT_URL` (and optional key) for phase 7
- Final license choice (default MIT; change if the owner prefers MPL-2.0)

List every placeholder still present in your final report.
