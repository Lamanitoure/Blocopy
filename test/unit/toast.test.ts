// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ToastNotifier } from '../../src/content/ui/toast.js';
import { TOAST_HOST_TAG, TOAST_DURATION_MS } from '../../src/shared/config/ui.js';

describe('ToastNotifier (Spec Section 10.2 & Phase 4 Task 3)', () => {
  let notifier: ToastNotifier;

  beforeEach(() => {
    vi.useFakeTimers();
    document.documentElement.innerHTML = '<head></head><body></body>';
    (globalThis as unknown as { browser: unknown }).browser = {
      i18n: {
        getMessage: vi.fn((key: string) => {
          if (key === 'toastCopied') return 'Copied';
          if (key === 'toastCopyFailed') return 'Could not copy';
          if (key === 'toastNothingLeft') return 'Nothing left to copy';
          if (key === '@@bidi_dir') return 'ltr';
          return '';
        }),
      },
    };
    notifier = new ToastNotifier(document);
  });

  afterEach(() => {
    notifier.destroy();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  // 1. Appends host to documentElement with closed shadow root
  it('1. appends toast host to documentElement with closed shadow root', () => {
    notifier.notify('copied');

    const host = document.querySelector(TOAST_HOST_TAG);
    expect(host).not.toBeNull();
    expect(host?.parentElement).toBe(document.documentElement);
    // Closed shadow root is not accessible from host.shadowRoot
    expect(host?.shadowRoot).toBeNull();
  });

  // 2. Renders toast element with role="status" and dir="ltr"
  it('2. renders toast element with accessibility attributes role="status" and dir', () => {
    notifier.notify('copied');

    const toastEl = notifier.getToastElementForTesting();
    expect(toastEl).not.toBeNull();
    expect(toastEl?.getAttribute('role')).toBe('status');
    expect(toastEl?.getAttribute('dir')).toBe('ltr');
    expect(toastEl?.textContent).toBe('Copied');
  });

  // 3. Displays correct message for each NotificationKind
  it('3. displays corresponding localized message for each NotificationKind', () => {
    notifier.notify('failed');
    expect(notifier.getToastElementForTesting()?.textContent).toBe('Could not copy');

    notifier.notify('empty');
    expect(notifier.getToastElementForTesting()?.textContent).toBe('Nothing left to copy');
  });

  // 4. Reuses host and maintains MAX_TOAST_STACK = 1
  it('4. reuses host element and ensures no more than 1 toast is present', () => {
    notifier.notify('copied');
    notifier.notify('copied');

    const hosts = document.querySelectorAll(TOAST_HOST_TAG);
    expect(hosts.length).toBe(1);
    expect(notifier.getToastCountForTesting()).toBe(1);
  });

  // 5. Automatically dismisses after TOAST_DURATION_MS
  it('5. auto-dismisses toast after TOAST_DURATION_MS', () => {
    notifier.notify('copied');
    expect(notifier.getToastElementForTesting()).not.toBeNull();

    // Fast-forward timer past TOAST_DURATION_MS
    vi.advanceTimersByTime(TOAST_DURATION_MS + 200);

    expect(notifier.getToastElementForTesting()).toBeNull();
  });
});
