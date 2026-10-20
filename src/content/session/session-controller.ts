import type { Highlighter, ClipboardPort, Notifier, SessionListenerPort } from './ports.js';
import { reduce, type SessionState, type SessionAction } from './session-state.js';
import { computeRanges } from '../dom/ranges.js';
import { listLeafUnits } from '../dom/units.js';
import { buildFragment } from '../clipboard/build-fragment.js';
import { sanitize } from '../clipboard/sanitize.js';
import { serializeHtml } from '../clipboard/serialize-html.js';
import { toPlainText } from '../clipboard/plain-text.js';

export class SessionController {
  private state: SessionState = { kind: 'idle' };

  constructor(
    private readonly highlighter: Highlighter,
    private readonly clipboard: ClipboardPort,
    private readonly notifier: Notifier,
    private readonly listeners: SessionListenerPort
  ) {}

  getState(): SessionState {
    return this.state;
  }

  // Serializes container content minus exclusions and writes to clipboard port
  private async copyContainer(container: Element, excluded: readonly Element[]): Promise<void> {
    try {
      const raw = buildFragment(container, excluded);
      const clean = sanitize(raw);
      const html = serializeHtml(clean);
      const text = toPlainText(clean);
      await this.clipboard.write({ html, text });
      this.notifier.notify('copied');
    } catch {
      this.notifier.notify('failed');
    }
  }

  // Updates highlight layer and evaluates unit exclusion status
  private async processActiveContainer(container: Element, excluded: ReadonlySet<Element>): Promise<void> {
    const excludedArray = Array.from(excluded);
    const ranges = computeRanges(container, excludedArray);
    this.highlighter.show(ranges);

    const allUnits = listLeafUnits(container);
    const hasRemainingUnit = allUnits.some((unit) => !excluded.has(unit));

    if (!hasRemainingUnit) {
      this.notifier.notify('empty');
      return;
    }

    await this.copyContainer(container, excludedArray);
  }

  // Dispatches actions to transition state and orchestrate side-effect ports
  async dispatch(action: SessionAction): Promise<void> {
    const prev = this.state;
    const next = reduce(this.state, action);
    if (next === prev) {
      return;
    }

    this.state = next;

    if (next.kind === 'idle') {
      this.highlighter.clear();
      this.listeners.detach();
      return;
    }

    const currentContainer = next.levels[next.levelIndex];
    if (!currentContainer || !currentContainer.isConnected) {
      await this.dispatch({ type: 'end' });
      return;
    }

    this.listeners.attach(currentContainer, (act: SessionAction) => {
      void this.dispatch(act);
    });

    await this.processActiveContainer(currentContainer, next.excluded);
  }
}
