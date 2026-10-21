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

// Processes permanent dblclick event on the page
async function onDblClick(
  event: MouseEvent,
  controller: SessionController,
  deps: ContentScriptDependencies,
  dom: DomContext
): Promise<void> {
  const target = resolveTarget(event);
  if (!target) {
    return;
  }

  const context: EligibilityContext = {
    isSiteDisabled: deps.isSiteDisabled(),
    settingsLoaded: true,
    ...(deps.bypassTrustCheck !== undefined ? { bypassTrustCheck: deps.bypassTrustCheck } : {}),
  };

  if (!isEligible(event, target, context, dom.doc.body)) {
    return;
  }

  await handleEligibleDblClick(target, controller);
  dom.win.getSelection()?.removeAllRanges();
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

  const dblClickListener = (event: MouseEvent): void => {
    void onDblClick(event, controller, deps, dom);
  };

  doc.addEventListener('dblclick', dblClickListener, { capture: true });

  const unsubscribeSettings = deps.onSiteDisabledChange?.((disabled: boolean) => {
    if (disabled) {
      void controller.dispatch({ type: 'end' });
    }
  });

  const destroy = (): void => {
    doc.removeEventListener('dblclick', dblClickListener, { capture: true });
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
