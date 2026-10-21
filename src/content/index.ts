// Composition root: wires modules, registers permanent dblclick listener (Spec Section 9.3)

import type {
  Highlighter,
  ClipboardPort,
  Notifier,
  SessionListenerPort,
} from './session/ports.js';
import { SessionController } from './session/session-controller.js';
import { resolveTarget } from './dom/target.js';
import { isEligible, type EligibilityContext } from './dom/eligibility.js';
import { findLevels } from './dom/level-finder.js';
import { AsyncClipboardWriter } from './clipboard/clipboard-writer.js';
import { CssHighlighter } from './highlight/css-highlighter.js';
import { DomSessionListeners } from './events/listeners.js';
import { SiteSettingsManager } from './settings/site-settings.js';
import { ToastNotifier } from './ui/toast.js';

export interface ContentScriptDependencies {
  readonly highlighter: Highlighter;
  readonly clipboard: ClipboardPort;
  readonly notifier: Notifier;
  readonly listeners: SessionListenerPort;
  readonly isSiteDisabled: () => boolean;
  readonly onSiteDisabledChange?: (callback: (disabled: boolean) => void) => () => void;
  readonly doc?: Document;
  readonly win?: Window;
  readonly bypassTrustCheck?: boolean;
}

// Dispatches start or expand action depending on current session container
async function handleEligibleDblClick(
  target: Element,
  controller: SessionController
): Promise<void> {
  const state = controller.getState();

  if (state.kind === 'active') {
    const currentContainer = state.levels[state.levelIndex];
    if (currentContainer && currentContainer.contains(target)) {
      await controller.dispatch({ type: 'expand' });
      return;
    }
  }

  const levels = findLevels(target);
  if (levels.length > 0) {
    await controller.dispatch({ type: 'start', levels });
  }
}

interface DomContext {
  readonly doc: Document;
  readonly win: Window;
}

// Claims an eligible gesture before native selection or page handlers can act on it.
function claimEligibleGesture(
  event: MouseEvent,
  deps: ContentScriptDependencies,
  dom: DomContext
): Element | null {
  const target = resolveTarget(event);
  if (!target) {
    return null;
  }

  const context: EligibilityContext = {
    isSiteDisabled: deps.isSiteDisabled(),
    settingsLoaded: true,
    ...(deps.bypassTrustCheck !== undefined ? { bypassTrustCheck: deps.bypassTrustCheck } : {}),
  };

  if (!isEligible(event, target, context, dom.doc.body)) {
    return null;
  }

  event.preventDefault();
  event.stopPropagation();
  dom.win.getSelection()?.removeAllRanges();
  return target;
}

// Processes permanent dblclick event when a browser did not report a second mouse-down.
async function onDblClick(
  event: MouseEvent,
  controller: SessionController,
  deps: ContentScriptDependencies,
  dom: DomContext
): Promise<void> {
  const target = claimEligibleGesture(event, deps, dom);
  if (!target) {
    return;
  }

  await handleEligibleDblClick(target, controller);
}

// Starts selection on the second mouse-down, which is more reliable than dblclick alone.
function onMouseDown(
  event: MouseEvent,
  controller: SessionController,
  deps: ContentScriptDependencies,
  dom: DomContext
): boolean {
  if (event.detail !== 2) {
    return false;
  }

  const target = claimEligibleGesture(event, deps, dom);
  if (!target) {
    return false;
  }

  void handleEligibleDblClick(target, controller);
  return true;
}

// Composition root initializing the content script controller and event wiring
export function initContentScript(deps: ContentScriptDependencies): {
  readonly controller: SessionController;
  readonly destroy: () => void;
} {
  const doc = deps.doc ?? document;
  const win = deps.win ?? window;
  const dom: DomContext = { doc, win };

  const controller = new SessionController(
    deps.highlighter,
    deps.clipboard,
    deps.notifier,
    deps.listeners
  );

  let skipNextDblClick = false;
  const dblClickListener = (event: MouseEvent): void => {
    if (skipNextDblClick) {
      skipNextDblClick = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    void onDblClick(event, controller, deps, dom);
  };
  const mouseDownListener = (event: MouseEvent): void => {
    skipNextDblClick = onMouseDown(event, controller, deps, dom);
  };

  doc.addEventListener('dblclick', dblClickListener, { capture: true });
  doc.addEventListener('mousedown', mouseDownListener, { capture: true });

  const unsubscribeSettings = deps.onSiteDisabledChange?.((disabled: boolean) => {
    if (disabled) {
      void controller.dispatch({ type: 'end' });
    }
  });

  const destroy = (): void => {
    doc.removeEventListener('dblclick', dblClickListener, { capture: true });
    doc.removeEventListener('mousedown', mouseDownListener, { capture: true });
    unsubscribeSettings?.();
    void controller.dispatch({ type: 'end' });
  };

  return { controller, destroy };
}

// Creates the browser-facing dependencies and starts one controller per frame.
function bootstrapContentScript(): void {
  const settings = new SiteSettingsManager();
  const hostname = window.location.hostname;

  void settings.init().catch(() => undefined).then(() => {
    initContentScript({
      highlighter: new CssHighlighter(),
      clipboard: new AsyncClipboardWriter(),
      notifier: new ToastNotifier(),
      listeners: new DomSessionListeners(),
      isSiteDisabled: () => settings.isSiteDisabled(hostname),
      onSiteDisabledChange: (callback) => settings.onSiteDisabledChange(hostname, callback),
    });
  });
}

// Unit tests import this module directly; the browser global only exists in WebExtension contexts.
if (typeof browser !== 'undefined') {
  bootstrapContentScript();
}
