# Blocopy

Double-click to select and copy a whole block of text. Click a paragraph to leave it out.

## Gestures

| Gesture | When idle | During a session |
|---|---|---|
| Double-click on eligible text | Start a session at level 0, highlight, copy. | Inside container: expand one level (clears exclusions). Outside: start new session on target. |
| Plain left click on unit inside container | Normal behavior. | Toggle unit exclusion, re-render, copy again. |
| Plain left click outside container | Normal behavior. | End session. Click goes through untouched. |
| Escape | Nothing. | Go down one level. At level 0: cancel session (clear highlight, clipboard unchanged). |
| Alt + double-click | Native behavior. | Native behavior. Never intercepted. |
| Ctrl/Cmd/Shift + click, middle, right click | Normal. | Normal. Never intercepted. |

## Privacy Statement

No network access, no data collected, nothing leaves your device. Blocopy does not track you, does not phone home, and makes zero network requests.

## Architecture

- **Manifest V3 Firefox Extension**: Pure TypeScript, zero runtime dependencies.
- **Pure Reducer State Machine**: Manages selection levels and exclusion sets without DOM side effects.
- **Ports & Adapters**: Controller orchestrates decoupled Highlighter, Clipboard, and Notifier ports.
- **CSS Custom Highlight API**: Zero-DOM-mutation highlighting with native system theme colors.
- **Strict Sanitizer**: Whitelist-based cloning and cleaning of HTML content before clipboard writes.
- **Logical i18n & Logical CSS**: English source with bidirectional RTL layout support.

## Install for Development

```bash
npm install
npm run build
npm run dev
```
