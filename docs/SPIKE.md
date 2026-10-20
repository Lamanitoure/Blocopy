# Feasibility Spike Results & Platform Assumptions

Tracking platform assumptions A1-A5 according to section 4 and phase 1 of the Blocopy specification.

## Assumptions & Results

| # | Assumption | Status | Result & Decision |
|---|---|---|---|
| **A1** | `strict_min_version` of **140.0** gives: CSS Custom Highlight API, `ClipboardItem` write, MV3 content scripts. | **Confirmed by MDN** | MDN browser-compat data confirms CSS Custom Highlight API (`Highlight`, `CSS.highlights`, `::highlight()`) was implemented in Firefox desktop starting with version **140.0**. Setting `strict_min_version = "140.0"`. |
| **A2** | `new Highlight(...)` and `CSS.highlights` work from a Firefox content script, and `::highlight(name)` rules from a content-script-injected stylesheet apply to the page. | **Owner Manual Step Prepared** | Spike extension built in `docs/spike/`. Decision rule: Target `css-highlighter.ts`. If owner testing shows styling isolation issue in content script, fallback to `overlay-highlighter.ts`. |
| **A3** | `navigator.clipboard.write([ClipboardItem])` works in a content script during a user gesture **without** the `clipboardWrite` permission. | **Owner Manual Step Prepared** | Spike tests `navigator.clipboard.write([ClipboardItem])` directly. If user gesture is sufficient, keep `clipboardWrite` excluded. If permission error occurs, add `clipboardWrite` to manifest and document. |
| **A4** | After install, the content script runs on pages without any extra permission grant from the user. | **Confirmed** | Matches `<all_urls>` in content scripts under Firefox Manifest V3 run automatically at `document_idle`. |
| **A5** | The manifest key `browser_specific_settings.gecko.data_collection_permissions` is accepted by `web-ext lint`. | **Verified** | Validated via `web-ext lint` with 0 errors. |

---

## Instructions for Owner (Manual Browser Test in Firefox >= 140.0)

Since the headless CI environment does not have a desktop Firefox binary installed, please execute this quick 60-second test:

1. Open Firefox desktop (version ≥ 140.0).
2. Navigate to `about:debugging#/runtime/this-firefox`.
3. Click **"Load Temporary Add-on..."** and select `docs/spike/manifest.json`.
4. Open `docs/spike/test-page.html` in a tab (or drag-and-drop into Firefox).
5. Open Developer Tools (F12) -> **Console** tab.
6. **Double-click** on the first paragraph.
7. Observe:
   - Does the paragraph highlight in system highlight color?
   - In Console, do you see:
     `[Blocopy Spike] CSS.highlights successfully set`?
     `[Blocopy Spike] navigator.clipboard.write succeeded with ClipboardItem!`?
8. Click into the "Paste Test" editable box and press **Ctrl+V** (or **Cmd+V**).
   - Does the pasted text include the bold formatted prefix?

### Reporting Back
- If both highlight and clipboard write succeeded: CSS highlighter confirmed, no `clipboardWrite` needed.
- If clipboard write threw a permission error: we will add `clipboardWrite` before phase 4.
- If CSS highlight did not appear visually on page: we will use `overlay-highlighter.ts` in phase 5.
