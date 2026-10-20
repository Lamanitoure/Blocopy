// User notification toast in closed Shadow DOM (Spec Section 10.2 & 11.4)

import type { NotificationKind } from '../../shared/types.js';
import type { Notifier } from '../session/ports.js';
import {
  TOAST_HOST_TAG,
  TOAST_DURATION_MS,
  NOTIFICATION_I18N_KEYS,
} from '../../shared/config/ui.js';
import { MAX_TOAST_STACK } from '../../shared/config/limits.js';
import { t } from '../../shared/i18n.js';
import toastCss from './toast.css';

// Manages isolated user feedback toasts in a closed shadow root attached to documentElement
export class ToastNotifier implements Notifier {
  private readonly doc: Document;
  private host: HTMLElement | null = null;
  private shadow: ShadowRoot | null = null;
  private currentToast: HTMLElement | null = null;
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  public constructor(customDoc?: Document) {
    this.doc = customDoc ?? document;
  }

  // Ensures closed shadow host container exists on documentElement
  private ensureHost(): ShadowRoot {
    if (this.shadow && this.host?.isConnected) {
      return this.shadow;
    }

    let existingHost = this.doc.querySelector<HTMLElement>(TOAST_HOST_TAG);
    if (!existingHost) {
      existingHost = this.doc.createElement(TOAST_HOST_TAG);
      this.doc.documentElement.appendChild(existingHost);
    }

    this.host = existingHost;
    // Closed shadow DOM prevents page scripts from inspecting or mutating toasts
    this.shadow = existingHost.attachShadow({ mode: 'closed' });

    const style = this.doc.createElement('style');
    const cssText = toastCss as unknown as string;
    style.textContent = cssText;
    this.shadow.appendChild(style);

    return this.shadow;
  }

  // Removes current toast node from shadow root
  private clearActiveToast(): void {
    if (this.dismissTimer !== null) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
    if (this.currentToast) {
      this.currentToast.remove();
      this.currentToast = null;
    }
  }

  // Displays a localized notification toast for the given notification kind
  public notify(kind: NotificationKind): void {
    const shadowRoot = this.ensureHost();

    // Enforce MAX_TOAST_STACK by clearing any active toast
    if (this.getToastCountForTesting() >= MAX_TOAST_STACK) {
      this.clearActiveToast();
    }

    const toast = this.doc.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('dir', t('@@bidi_dir'));

    const i18nKey = NOTIFICATION_I18N_KEYS[kind];
    toast.textContent = t(i18nKey);

    shadowRoot.appendChild(toast);
    this.currentToast = toast;

    // Trigger visibility transition
    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    this.dismissTimer = setTimeout(() => {
      this.clearActiveToast();
    }, TOAST_DURATION_MS);
  }

  // Cleans up host and pending timers
  public destroy(): void {
    this.clearActiveToast();
    if (this.host?.isConnected) {
      this.host.remove();
    }
    this.host = null;
    this.shadow = null;
  }

  // Test inspection helper to retrieve current toast element inside closed shadow root
  public getToastElementForTesting(): HTMLElement | null {
    return this.currentToast;
  }

  // Test inspection helper to count current toast elements
  public getToastCountForTesting(): number {
    return this.currentToast ? 1 : 0;
  }
}
