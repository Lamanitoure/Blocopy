# Feasibility Spike Results & Platform Assumptions

Tracking platform assumptions A1-A5 according to section 4 of the Blocopy specification.

## Assumptions Table

| # | Assumption | Status | Result / Decision |
|---|---|---|---|
| A1 | `strict_min_version` of **140.0** gives: CSS Custom Highlight API, `ClipboardItem` write, MV3 content scripts. | Pending browser verification | MDN documentation confirms CSS Custom Highlight API and ClipboardItem are supported in modern Firefox. Verification procedure prepared for Phase 1. |
| A2 | `new Highlight(...)` and `CSS.highlights` work from a Firefox content script, and `::highlight(name)` rules from a content-script-injected stylesheet apply to the page. | Pending browser verification | Target implementation defaults to `css-highlighter.ts`. Fallback `overlay-highlighter.ts` specified if content script stylesheet isolation prevents highlight rendering. |
| A3 | `navigator.clipboard.write([ClipboardItem])` works in a content script during a user gesture **without** the `clipboardWrite` permission. | Pending browser verification | Initial manifest contains no `clipboardWrite`. If clipboard write fails during user gesture, `clipboardWrite` will be added and documented. |
| A4 | After install, the content script runs on pages without any extra permission grant from the user. | Pending browser verification | `<all_urls>` is declared in `content_scripts`. |
| A5 | The manifest key `browser_specific_settings.gecko.data_collection_permissions` is accepted by `web-ext lint`. | Verified | Validated via `web-ext lint`. |

## Manual Verification Steps for Owner

See Phase 1 instructions in `docs/spike/`.
