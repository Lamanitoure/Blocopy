// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionController } from '../../src/content/session/session-controller.js';
import type {
  Highlighter,
  ClipboardPort,
  Notifier,
  SessionListenerPort,
} from '../../src/content/session/ports.js';
import type { ClipboardPayload, NotificationKind } from '../../src/shared/types.js';
import type { SessionAction } from '../../src/content/session/session-state.js';

describe('SessionController (Spec Section 9.3 & Phase 3 Task 1)', () => {
  let highlighter: Highlighter;
  let clipboard: ClipboardPort;
  let notifier: Notifier;
  let listeners: SessionListenerPort;
  let controller: SessionController;

  let showMock: ReturnType<typeof vi.fn<(ranges: readonly Range[]) => void>>;
  let clearMock: ReturnType<typeof vi.fn<() => void>>;
  let writeMock: ReturnType<typeof vi.fn<(payload: ClipboardPayload) => Promise<void>>>;
  let notifyMock: ReturnType<typeof vi.fn<(kind: NotificationKind) => void>>;
  let attachMock: ReturnType<typeof vi.fn<(container: Element, dispatch: (action: SessionAction) => void) => void>>;
  let detachMock: ReturnType<typeof vi.fn<() => void>>;

  let article: HTMLElement;
  let section: HTMLElement;
  let p1: HTMLElement;
  let p2: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';

    section = document.createElement('section');
    article = document.createElement('article');
    p1 = document.createElement('p');
    p1.textContent = 'First test paragraph.';
    p2 = document.createElement('p');
    p2.textContent = 'Second test paragraph.';

    article.append(p1, p2);
    section.appendChild(article);
    document.body.appendChild(section);

    showMock = vi.fn<(ranges: readonly Range[]) => void>();
    clearMock = vi.fn<() => void>();
    writeMock = vi.fn<(payload: ClipboardPayload) => Promise<void>>().mockResolvedValue(undefined);
    notifyMock = vi.fn<(kind: NotificationKind) => void>();
    attachMock = vi.fn<(container: Element, dispatch: (action: SessionAction) => void) => void>();
    detachMock = vi.fn<() => void>();

    highlighter = { show: (ranges) => { showMock(ranges); }, clear: () => { clearMock(); } };
    clipboard = { write: async (payload) => { await writeMock(payload); } };
    notifier = { notify: (kind) => { notifyMock(kind); } };
    listeners = {
      attach: (container, dispatch) => { attachMock(container, dispatch); },
      detach: () => { detachMock(); },
    };

    controller = new SessionController(highlighter, clipboard, notifier, listeners);
  });

  // 1. Start session
  it('1. start: highlights container, writes clipboard, notifies "copied", attaches listeners', async () => {
    await controller.dispatch({ type: 'start', levels: [article, section] });

    expect(controller.getState().kind).toBe('active');
    expect(showMock).toHaveBeenCalledTimes(1);
    expect(writeMock).toHaveBeenCalledTimes(1);
    expect(notifyMock).toHaveBeenCalledWith('copied');
    expect(attachMock).toHaveBeenCalledWith(article, expect.any(Function));

    const payload = writeMock.mock.calls[0]?.[0] as ClipboardPayload;
    expect(payload.text).toContain('First test paragraph.');
    expect(payload.text).toContain('Second test paragraph.');
  });

  // 2. Expand session
  it('2. expand: advances level, clears exclusions, writes updated clipboard, notifies "copied"', async () => {
    await controller.dispatch({ type: 'start', levels: [article, section] });
    // First toggle p1
    await controller.dispatch({ type: 'toggle', unit: p1 });
    expect(notifyMock).toHaveBeenLastCalledWith('copied');

    // Expand to section level
    await controller.dispatch({ type: 'expand' });

    expect(controller.getState()).toMatchObject({
      kind: 'active',
      levelIndex: 1,
    });
    expect(attachMock).toHaveBeenLastCalledWith(section, expect.any(Function));
    expect(notifyMock).toHaveBeenLastCalledWith('copied');
  });

  // 3. Back at level 0
  it('3. back at level 0: clears highlighter, detaches listeners, returns to idle, clipboard untouched', async () => {
    await controller.dispatch({ type: 'start', levels: [article, section] });
    writeMock.mockClear();

    await controller.dispatch({ type: 'back' });

    expect(controller.getState()).toEqual({ kind: 'idle' });
    expect(clearMock).toHaveBeenCalledTimes(1);
    expect(detachMock).toHaveBeenCalledTimes(1);
    expect(writeMock).not.toHaveBeenCalled();
  });

  // 4. Toggle
  it('4. toggle: toggles exclusion, updates highlight, writes updated clipboard payload', async () => {
    await controller.dispatch({ type: 'start', levels: [article, section] });
    writeMock.mockClear();

    await controller.dispatch({ type: 'toggle', unit: p1 });

    expect(showMock).toHaveBeenCalledTimes(2);
    expect(writeMock).toHaveBeenCalledTimes(1);
    expect(notifyMock).toHaveBeenLastCalledWith('copied');

    const payload = writeMock.mock.calls[0]?.[0] as ClipboardPayload;
    expect(payload.text).not.toContain('First test paragraph.');
    expect(payload.text).toContain('Second test paragraph.');
  });

  // 5. All-excluded path
  it('5. all-excluded path: notifies "empty" and does not write to clipboard', async () => {
    await controller.dispatch({ type: 'start', levels: [article] });
    writeMock.mockClear();
    notifyMock.mockClear();

    // Exclude p1
    await controller.dispatch({ type: 'toggle', unit: p1 });
    // Exclude p2 (all units excluded)
    await controller.dispatch({ type: 'toggle', unit: p2 });

    expect(notifyMock).toHaveBeenLastCalledWith('empty');
    // Only the first toggle wrote to clipboard; the second toggle did not write
    expect(writeMock).toHaveBeenCalledTimes(1);
  });

  // 6. Container removed from the DOM
  it('6. container removed from the DOM: dispatches end and resets to idle', async () => {
    await controller.dispatch({ type: 'start', levels: [article] });
    expect(controller.getState().kind).toBe('active');

    // Remove article from DOM
    article.remove();
    expect(article.isConnected).toBe(false);

    // Any subsequent action (e.g. toggle or expand) detects disconnected container and transitions to idle
    await controller.dispatch({ type: 'toggle', unit: p1 });

    expect(controller.getState()).toEqual({ kind: 'idle' });
    expect(clearMock).toHaveBeenCalled();
    expect(detachMock).toHaveBeenCalled();
  });

  // 7. Clipboard failure
  it('7. clipboard failure: notifies "failed" when clipboard.write rejects', async () => {
    clipboard.write = vi.fn().mockRejectedValue(new Error('Permission denied'));

    await controller.dispatch({ type: 'start', levels: [article] });

    expect(notifyMock).toHaveBeenCalledWith('failed');
  });

  // 8. Site disabled mid-session
  it('8. site disabled mid-session: dispatching "end" cleans up highlight and returns to idle', async () => {
    await controller.dispatch({ type: 'start', levels: [article] });
    expect(controller.getState().kind).toBe('active');

    // Site settings changed / disabled -> dispatch end
    await controller.dispatch({ type: 'end' });

    expect(controller.getState()).toEqual({ kind: 'idle' });
    expect(clearMock).toHaveBeenCalledTimes(1);
    expect(detachMock).toHaveBeenCalledTimes(1);
  });
});
