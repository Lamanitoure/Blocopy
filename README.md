# Blocopy (React Edition)

Double-click to select and copy a whole block of text. Click a paragraph to leave it out.

Blocopy is an intelligent semantic text selection and clipboard sanitizer rewritten as a modern React application with live document sandboxing, dual-format (`text/html` and `text/plain`) clipboard compilation, and hierarchy level navigation.

## Features

- **Semantic Block Selection**: Double-click any paragraph, heading, list item, or blockquote to instantly select and copy its cohesive container.
- **Single-Click Exclusions**: Click any paragraph inside the active container to leave it out of the selection. The clipboard updates immediately.
- **Container Hierarchy Expansion**: Double-click inside an active container to climb up one level (e.g. from an individual chat message to the entire conversation thread).
- **Escape / Shrink**: Press `Escape` or click the shrink control to step back down through levels, or cancel at Level 0.
- **Dual-format MIME Clipboard Output**: Writes both sanitized rich HTML (compatible with Google Docs, Microsoft Word, Slack, Notion) and structured Markdown plaintext.
- **Zero-DOM Mutation Highlighting**: Active selection and excluded states are simulated with clean CSS highlight and border overlays without breaking page layout.
- **Zero Telemetry Guarantee**: Runs 100% on-device in the browser runtime. Makes zero network calls and collects no data.

## Gestures & Controls

| Gesture | When idle | During a session |
|---|---|---|
| **Double-click** on text | Start session at Level 0, highlight, copy to clipboard | Inside container: expand up one level (resets exclusions). Outside: start new session on target |
| **Plain left-click** on unit inside container | Normal behavior | Toggle unit exclusion, re-render, update clipboard |
| **Plain left-click** outside container | Normal behavior | End selection session cleanly |
| **Escape** | Nothing | Step down one level. At Level 0: cancel session |
| **Alt + double-click** | Native behavior | Native browser behavior (never intercepted) |
| **Ctrl/Cmd/Shift + click** | Normal browser behavior | Never intercepted (opens links, multiselect) |

## Development & Build

```bash
npm install
npm run dev     # Starts Vite dev server on port 3000
npm run build   # Production build
npm test        # Runs unit tests (46 tests passing)
npm run lint    # ESLint verification
```
