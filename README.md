# Blocopy

Double-click to select and copy a whole block of text. Click a paragraph to leave it out.

## What it does

Blocopy is a Firefox desktop WebExtension (Manifest V3) that streamlines text copying:
- **Block Selection**: Double-click any paragraph, heading, list item, or quote to select and copy its cohesive container block.
- **Exclusions**: Click any paragraph inside the container to exclude it from the selection. The clipboard updates immediately.
- **Hierarchy Climbing**: Double-click inside the selection to step up one container level (e.g. from an individual message to a whole thread).
- **Dual Representation**: Automatically writes both sanitized rich `text/html` and clean `text/plain` to the clipboard.
- **Zero Layout Shift**: Highlights selections using the CSS Custom Highlight API without modifying the live DOM.

## Gestures

| Gesture | When idle | During a session |
|---|---|---|
| **Double-click on eligible text** | Start session at Level 0, highlight, copy | Inside container: expand up one level (clears exclusions). Outside: start new session on target |
| **Plain left click on unit inside container** | Normal behavior | Toggle unit exclusion, re-render highlight, copy updated selection |
| **Plain left click outside container** | Normal behavior | End session cleanly. Click passes through untouched |
| **Escape** | Nothing | Go down one level. At Level 0: cancel session (clipboard unchanged) |
| **Alt + double-click** | Native behavior | Native browser word selection (never intercepted) |
| **Ctrl/Cmd/Shift + click, middle, right click** | Normal | Normal browser behavior (links open, context menus work) |

## Architecture in 10 lines

```
1. Composition root (index.ts) wires adapters to the session controller with zero logic.
2. Events (listeners.ts) capture gestures using AbortController and delegate to guards.
3. Eligibility guard (eligibility.ts) prevents interaction on inputs, links, and forms.
4. Level finder (level-finder.ts) traverses ancestor trees using bounded TreeWalkers.
5. Session state machine (session-state.ts) operates as a pure deterministic reducer.
6. Controller (session-controller.ts) dispatches transitions through isolated ports.
7. Fragment builder (build-fragment.ts) clones trees and strips exclusions non-destructively.
8. Sanitizer allowlist (sanitize.ts) outputs safe HTML nodes with zero innerHTML parsing.
9. Plain text converter (plain-text.ts) formats readable text with preserved list hierarchy.
10. Highlighter (css-highlighter.ts) paints selections using native CSS Custom Highlight API.
```

## Privacy & Security

**No network access, no data collected, nothing leaves your device.**
- Minimal permissions: only `storage` (persists disabled site list) and `activeTab`.
- No telemetry, no analytics, no external fonts or scripts.
- Toasts render inside a closed shadow root.
- The clipboard is only written to; Blocopy never reads your clipboard.

## Limitations

- **Platform**: Targeted for desktop Firefox with Manifest V3 (`strict_min_version: 140.0`).
- **Iframes**: Per-frame activation uses the frame's own `location.hostname`. Cross-origin iframes remain enabled unless their own domain is explicitly disabled in the popup.
- **Max Selection Size**: Selections exceeding 200,000 characters stop climbing to prevent memory overhead.
- **Paste Behavior**: Paste handling is out of scope; your system's native paste handles pasting into any rich editor or plaintext app.

## Development & Testing

```bash
# Install dependencies
npm install

# Start development mode
npm run dev

# Run all verification checks
npm run verify
```
