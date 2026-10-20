// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initContentScript } from '../../src/content/index.js';
import type {
  Highlighter,
  ClipboardPort,
  Notifier,
  SessionListenerPort,
} from '../../src/content/session/ports.js';
import type { SessionAction } from '../../src/content/session/session-state.js';

describe('Content Script Wiring (Spec Section 9.3 & Phase 3 Task 4)', () => {
  let highlighter: Highlighter;
  let clipboard: ClipboardPort;
  let notifier: Notifier;
  let listeners: SessionListenerPort;
  let isSiteDisabled: ReturnType<typeof vi.fn<() => boolean>>;
  let siteDisabledChangeCallback: ((disabled: boolean) => void) | null;

  let article: HTMLElement;
  let section: HTMLElement;
  let p1: HTMLElement;
  let p2: HTMLElement;
  let button: HTMLButtonElement;

  beforeEach(() => {
    document.body.innerHTML = '';

    section = document.createElement('section');
    article = document.createElement('article');
    p1 = document.createElement('p');
    p1.textContent = 'Paragraph 1';
    p2 = document.createElement('p');
    p2.textContent = 'Paragraph 2';

    button = document.createElement('button');
    button.textContent = 'Interactive button';
    p2.appendChild(button);

    article.append(p1, p2);
    section.appendChild(article);
    document.body.appendChild(section);

    highlighter = { show: vi.fn(), clear: vi.fn() };
    clipboard = { write: vi.fn().mockResolvedValue(undefined) };
    notifier = { notify: vi.fn() };
    listeners = { attach: vi.fn(), detach: vi.fn() };
    isSiteDisabled = vi.fn().mockReturnValue(false);
    siteDisabledChangeCallback = null;
    Object.defineProperty(Event.prototype, 'isTrusted', {
      get: () => true,
      configurable: true,
    });
  });

  function createDblClick(target: EventTarget, overrides: { altKey?: boolean } = {}): MouseEvent {
    const event = new MouseEvent('dblclick', {
      bubbles: true,
      cancelable: true,
      altKey: overrides.altKey ?? false,
    });
    Object.defineProperty(event, 'target', { value: target });
    Object.defineProperty(event, 'composedPath', { value: () => [target] });
    return event;
  }

  // 1. dblclick on eligible text starts a session at level 0
  it('1. permanent dblclick starts a session at level 0 on eligible text', async () => {
    const { controller, destroy } = initContentScript({
      highlighter,
      clipboard,
      notifier,
      listeners,
      isSiteDisabled,
      doc: document,
      win: window,
    });

    const event = createDblClick(p1);
    p1.dispatchEvent(event);

    // Wait for microtask / async dispatch completion
    await new Promise((r) => setTimeout(r, 10));

    expect(controller.getState().kind).toBe('active');
    expect(highlighter.show).toHaveBeenCalledTimes(1);
    expect(clipboard.write).toHaveBeenCalledTimes(1);
    expect(notifier.notify).toHaveBeenCalledWith('copied');

    destroy();
  });

  // 2. dblclick inside active container expands one level
  it('2. dblclick inside active container expands container level', async () => {
    const { controller, destroy } = initContentScript({
      highlighter,
      clipboard,
      notifier,
      listeners,
      isSiteDisabled,
      doc: document,
      win: window,
    });

    // First dblclick starts session on article
    p1.dispatchEvent(createDblClick(p1));
    await new Promise((r) => setTimeout(r, 10));

    expect(controller.getState()).toMatchObject({
      kind: 'active',
      levelIndex: 0,
    });

    // Second dblclick inside article expands to section
    p2.dispatchEvent(createDblClick(p2));
    await new Promise((r) => setTimeout(r, 10));

    expect(controller.getState()).toMatchObject({
      kind: 'active',
      levelIndex: 1,
    });

    destroy();
  });

  // 3. dblclick on interactive target is ignored per guard rules
  it('3. dblclick on interactive button is ignored', async () => {
    const { controller, destroy } = initContentScript({
      highlighter,
      clipboard,
      notifier,
      listeners,
      isSiteDisabled,
      doc: document,
      win: window,
    });

    button.dispatchEvent(createDblClick(button));
    await new Promise((r) => setTimeout(r, 10));

    expect(controller.getState().kind).toBe('idle');
    expect(highlighter.show).not.toHaveBeenCalled();

    destroy();
  });

  // 4. Site disabled changes mid-session dispatches end
  it('4. site becoming disabled ends the active session', async () => {
    const { controller, destroy } = initContentScript({
      highlighter,
      clipboard,
      notifier,
      listeners,
      isSiteDisabled,
      onSiteDisabledChange: (cb) => {
        siteDisabledChangeCallback = cb;
        return () => { siteDisabledChangeCallback = null; };
      },
      doc: document,
      win: window,
    });

    p1.dispatchEvent(createDblClick(p1));
    await new Promise((r) => setTimeout(r, 10));
    expect(controller.getState().kind).toBe('active');

    // Notify that site was disabled in settings
    siteDisabledChangeCallback?.(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(controller.getState().kind).toBe('idle');
    expect(highlighter.clear).toHaveBeenCalled();

    destroy();
  });
});
