// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DISABLED_HOSTS_KEY } from '../../src/shared/config/storage-keys.js';

describe('Popup Controller (Spec Section 10.3 & Phase 6)', () => {
  let fakeStorage: Record<string, unknown> = {};

  beforeEach(() => {
    fakeStorage = {};
    document.body.innerHTML = `
      <main class="popup-card">
        <h1 id="heading" class="popup-title"></h1>
        <section id="site-controls" class="popup-controls">
          <label class="toggle-row" for="site-toggle">
            <input type="checkbox" id="site-toggle" class="toggle-checkbox">
            <span id="site-toggle-label" class="toggle-text"></span>
          </label>
          <p id="unsupported-msg" class="unsupported-msg" hidden></p>
        </section>
        <footer class="popup-footer">
          <p id="hint" class="hint-text"></p>
        </footer>
      </main>
    `;

    (globalThis as unknown as { browser: unknown }).browser = {
      i18n: {
        getMessage: vi.fn((key: string, subs?: string | string[]) => {
          if (key === 'popupHeading') return 'Blocopy on this site';
          if (key === 'popupHint') return 'Alt + double-click selects a single word.';
          if (key === 'popupUnsupportedPage') return 'Blocopy cannot run on this page.';
          if (key === 'popupToggleLabel') {
            const h = Array.isArray(subs) ? (subs[0] ?? '') : (subs ?? '');
            return `Enabled on ${h}`;
          }
          if (key === '@@bidi_dir') return 'ltr';
          return '';
        }),
      },
      tabs: {
        query: vi.fn().mockResolvedValue([{ url: 'https://developer.mozilla.org/en-US/' }]),
      },
      storage: {
        local: {
          get: vi.fn((key: string) => Promise.resolve({ [key]: fakeStorage[key] })),
          set: vi.fn((items: Record<string, unknown>) => {
            Object.assign(fakeStorage, items);
            return Promise.resolve();
          }),
        },
      },
    };
  });

  it('1. populates heading and hint from localized strings', async () => {
    // Dynamically import popup logic
    await import('../../src/popup/popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise((r) => setTimeout(r, 10));

    const heading = document.getElementById('heading');
    const hint = document.getElementById('hint');
    expect(heading?.textContent).toBe('Blocopy on this site');
    expect(hint?.textContent).toBe('Alt + double-click selects a single word.');
  });

  it('2. displays enabled checkbox for HTTP/HTTPS url when not in disabledHosts', async () => {
    fakeStorage[DISABLED_HOSTS_KEY] = [];

    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise((r) => setTimeout(r, 10));

    const checkbox = document.getElementById('site-toggle') as HTMLInputElement;
    const label = document.getElementById('site-toggle-label');
    const unsupported = document.getElementById('unsupported-msg');

    expect(label?.textContent).toBe('Enabled on developer.mozilla.org');
    expect(checkbox.checked).toBe(true);
    expect(checkbox.disabled).toBe(false);
    expect(unsupported?.hidden).toBe(true);
  });

  it('3. checks off checkbox when current host is in disabledHosts', async () => {
    fakeStorage[DISABLED_HOSTS_KEY] = ['developer.mozilla.org'];

    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise((r) => setTimeout(r, 10));

    const checkbox = document.getElementById('site-toggle') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('4. shows unsupported notice for internal or non-HTTP URLs', async () => {
    const tabsApi = (globalThis as unknown as { browser: { tabs: { query: ReturnType<typeof vi.fn> } } }).browser.tabs;
    tabsApi.query.mockResolvedValue([{ url: 'about:config' }]);

    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise((r) => setTimeout(r, 10));

    const checkbox = document.getElementById('site-toggle') as HTMLInputElement;
    const unsupported = document.getElementById('unsupported-msg');

    expect(checkbox.disabled).toBe(true);
    expect(unsupported?.hidden).toBe(false);
    expect(unsupported?.textContent).toBe('Blocopy cannot run on this page.');
  });

  it('5. updates storage when toggling checkbox', async () => {
    fakeStorage[DISABLED_HOSTS_KEY] = [];

    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise((r) => setTimeout(r, 10));

    const checkbox = document.getElementById('site-toggle') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    // User unchecks the box
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    await new Promise((r) => setTimeout(r, 10));

    const setMock = (globalThis as unknown as { browser: { storage: { local: { set: ReturnType<typeof vi.fn> } } } }).browser.storage.local.set;
    expect(setMock).toHaveBeenCalledWith({
      [DISABLED_HOSTS_KEY]: ['developer.mozilla.org'],
    });
  });
});
