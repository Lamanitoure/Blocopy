// System clipboard writer implementation using modern Async Clipboard API (Spec Section 8.7)

import type { ClipboardPayload } from '../../shared/types.js';
import type { ClipboardPort } from '../session/ports.js';

const MIME_TEXT_HTML = 'text/html';
const MIME_TEXT_PLAIN = 'text/plain';

export class AsyncClipboardWriter implements ClipboardPort {
  private readonly navClipboard: Clipboard;

  public constructor(customClipboard?: Clipboard) {
    this.navClipboard = customClipboard ?? navigator.clipboard;
  }

  // Writes HTML and plaintext representations to system clipboard with fallback
  public async write(payload: ClipboardPayload): Promise<void> {
    const htmlBlob = new Blob([payload.html], { type: MIME_TEXT_HTML });
    const textBlob = new Blob([payload.text], { type: MIME_TEXT_PLAIN });

    const item = new ClipboardItem({
      [MIME_TEXT_HTML]: htmlBlob,
      [MIME_TEXT_PLAIN]: textBlob,
    });

    try {
      await this.navClipboard.write([item]);
    } catch {
      await this.navClipboard.writeText(payload.text);
    }
  }
}
