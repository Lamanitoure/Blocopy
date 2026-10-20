import type { ClipboardPayload } from '../shared/types.js';
import { listLeafUnits } from '../content/dom/units.js';
import { buildFragment } from '../content/clipboard/build-fragment.js';
import { sanitize } from '../content/clipboard/sanitize.js';
import { serializeHtml } from '../content/clipboard/serialize-html.js';
import { toPlainText } from '../content/clipboard/plain-text.js';
import { INTERACTIVE_SELECTOR } from '../shared/config/selectors.js';

export interface BlocopySession {
  targetElement: Element;
  levels: Element[];
  currentLevelIndex: number;
  currentContainer: Element;
  allUnits: Element[];
  excludedUnits: Element[];
  includedUnits: Element[];
  payload: ClipboardPayload | null;
  timestamp: number;
}

export type ToastType = 'copied' | 'info' | 'warn' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  subtext?: string;
}

export function isInteractiveTarget(target: Element): boolean {
  return target.closest(INTERACTIVE_SELECTOR) !== null;
}

export function createClipboardPayload(container: Element, excluded: Element[]): ClipboardPayload | null {
  const allUnits = listLeafUnits(container);
  const remainingUnits = allUnits.filter((u) => !excluded.includes(u));

  if (remainingUnits.length === 0) {
    return null;
  }

  const rawFragment = buildFragment(container, excluded);
  const cleanFragment = sanitize(rawFragment);
  const html = serializeHtml(cleanFragment);
  const text = toPlainText(cleanFragment);

  return { html, text };
}

export async function writeToSystemClipboard(payload: ClipboardPayload | null): Promise<boolean> {
  if (!payload || !payload.text) {
    return false;
  }

  try {
    if (typeof ClipboardItem !== 'undefined') {
      const textBlob = new Blob([payload.text], { type: 'text/plain' });
      const htmlBlob = new Blob([payload.html], { type: 'text/html' });
      const item = new ClipboardItem({
        'text/plain': textBlob,
        'text/html': htmlBlob,
      });
      await navigator.clipboard.write([item]);
      return true;
    }
    await navigator.clipboard.writeText(payload.text);
    return true;
  } catch (err) {
    console.warn('Clipboard write notice:', err);
    return false;
  }
  return false;
}
