import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { t } from '../../src/shared/i18n.js';

describe('i18n Translation Wrapper (Spec Section 11.1 & Phase 4 Task 2)', () => {
  const originalBrowser = (globalThis as unknown as { browser?: unknown }).browser;
  const originalNodeEnv = process.env['NODE_ENV'];

  afterEach(() => {
    (globalThis as unknown as { browser?: unknown }).browser = originalBrowser;
    process.env['NODE_ENV'] = originalNodeEnv;
  });

  beforeEach(() => {
    process.env['NODE_ENV'] = 'test';
  });

  // 1. Calls browser.i18n.getMessage with key and substitutions
  it('1. delegates to browser.i18n.getMessage and returns translated string', () => {
    const mockGetMessage = vi.fn().mockImplementation((key: string, subs?: string | string[]) => {
      if (key === 'popupToggleLabel' && subs) {
        const host = (Array.isArray(subs) ? subs[0] : subs) ?? '';
        return `Enabled on ${host}`;
      }
      if (key === 'toastCopied') {
        return 'Copied';
      }
      return '';
    });

    (globalThis as unknown as { browser: unknown }).browser = {
      i18n: { getMessage: mockGetMessage },
    };

    expect(t('toastCopied')).toBe('Copied');
    expect(mockGetMessage).toHaveBeenCalledWith('toastCopied', undefined);

    expect(t('popupToggleLabel', 'example.com')).toBe('Enabled on example.com');
    expect(mockGetMessage).toHaveBeenCalledWith('popupToggleLabel', 'example.com');
  });

  // 2. Returns ltr for @@bidi_dir default
  it('2. returns ltr for @@bidi_dir default', () => {
    (globalThis as unknown as { browser: unknown }).browser = {
      i18n: { getMessage: vi.fn().mockReturnValue('') },
    };

    expect(t('@@bidi_dir')).toBe('ltr');
  });

  // 3. Throws in test environment when key is missing
  it('3. throws in test environment when key is missing', () => {
    (globalThis as unknown as { browser: unknown }).browser = {
      i18n: { getMessage: vi.fn().mockReturnValue('') },
    };

    expect(() => t('nonExistentKey')).toThrow('Missing translation key: "nonExistentKey"');
  });

  // 4. Returns key in production environment when missing
  it('4. returns key in production environment when key is missing', () => {
    process.env['NODE_ENV'] = 'production';

    (globalThis as unknown as { browser: unknown }).browser = {
      i18n: { getMessage: vi.fn().mockReturnValue('') },
    };

    expect(t('nonExistentKey')).toBe('nonExistentKey');
  });
});
