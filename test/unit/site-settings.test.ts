import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SiteSettingsManager } from '../../src/content/settings/site-settings.js';
import { DISABLED_HOSTS_KEY } from '../../src/shared/config/storage-keys.js';
import type { StorageChangeDetails } from '../../src/content/settings/site-settings.js';

describe('SiteSettingsManager (Spec Section 10.3 & Phase 4 Task 4)', () => {
  let storageGetMock: ReturnType<typeof vi.fn<(keys: string) => Promise<Record<string, unknown>>>>;
  let addListenerMock: ReturnType<typeof vi.fn<(listener: (changes: Record<string, StorageChangeDetails>, area: string) => void) => void>>;
  let removeListenerMock: ReturnType<typeof vi.fn<(listener: (changes: Record<string, StorageChangeDetails>, area: string) => void) => void>>;
  let activeListener: ((changes: Record<string, StorageChangeDetails>, area: string) => void) | null;

  beforeEach(() => {
    activeListener = null;
    storageGetMock = vi.fn<(keys: string) => Promise<Record<string, unknown>>>().mockResolvedValue({
      [DISABLED_HOSTS_KEY]: ['disabled.com', 'blocked.org'],
    });

    addListenerMock = vi.fn().mockImplementation((listener) => {
      activeListener = listener as (changes: Record<string, StorageChangeDetails>, area: string) => void;
    });
    removeListenerMock = vi.fn().mockImplementation(() => {
      activeListener = null;
    });
  });

  function createCustomStorage() {
    return {
      local: {
        get: storageGetMock,
      },
      onChanged: {
        addListener: addListenerMock,
        removeListener: removeListenerMock,
      },
    };
  }

  // 1. Until first read completes, behaves as disabled
  it('1. returns false for isEnabled until first read completes', () => {
    let resolveStorage: ((val: Record<string, unknown>) => void) | undefined;
    storageGetMock.mockReturnValue(new Promise((resolve) => {
      resolveStorage = resolve;
    }));

    const settings = new SiteSettingsManager(createCustomStorage());
    expect(settings.isEnabled('example.com')).toBe(false);
    expect(settings.isSiteDisabled('example.com')).toBe(true);

    // Complete storage read
    resolveStorage?.({ [DISABLED_HOSTS_KEY]: [] });
  });

  // 2. Evaluates isEnabled correctly after initialization
  it('2. returns true for enabled hosts and false for disabled hosts', async () => {
    const settings = new SiteSettingsManager(createCustomStorage());
    await settings.init();

    expect(settings.isEnabled('example.com')).toBe(true);
    expect(settings.isSiteDisabled('example.com')).toBe(false);

    expect(settings.isEnabled('disabled.com')).toBe(false);
    expect(settings.isSiteDisabled('disabled.com')).toBe(true);

    expect(settings.isEnabled('blocked.org')).toBe(false);
    expect(settings.isSiteDisabled('blocked.org')).toBe(true);
  });

  // 3. Handles empty, missing, or non-array storage values safely
  it('3. handles missing or malformed storage gracefully', async () => {
    storageGetMock.mockResolvedValue({});

    const settings = new SiteSettingsManager(createCustomStorage());
    await settings.init();

    expect(settings.isEnabled('example.com')).toBe(true);
    expect(settings.isEnabled('any-site.com')).toBe(true);
  });

  // 4. Updates enablement when storage.onChanged fires
  it('4. updates enablement and fires listeners when storage.onChanged fires', async () => {
    const settings = new SiteSettingsManager(createCustomStorage());
    await settings.init();

    const changeSpy = vi.fn<(disabled: boolean) => void>();
    const unsubscribe = settings.onSiteDisabledChange('example.com', changeSpy);

    expect(settings.isEnabled('example.com')).toBe(true);

    // Simulate user disabling example.com in popup
    activeListener?.(
      {
        [DISABLED_HOSTS_KEY]: {
          newValue: ['disabled.com', 'blocked.org', 'example.com'],
          oldValue: ['disabled.com', 'blocked.org'],
        },
      },
      'local'
    );

    expect(settings.isEnabled('example.com')).toBe(false);
    expect(changeSpy).toHaveBeenCalledWith(true);

    // Unsubscribe removes callback
    unsubscribe();
    changeSpy.mockClear();

    activeListener?.(
      {
        [DISABLED_HOSTS_KEY]: {
          newValue: [],
        },
      },
      'local'
    );

    expect(settings.isEnabled('example.com')).toBe(true);
    expect(changeSpy).not.toHaveBeenCalled();
  });

  // 5. Destroys listeners cleanly
  it('5. cleans up onChanged listener on destroy', async () => {
    const settings = new SiteSettingsManager(createCustomStorage());
    await settings.init();

    expect(addListenerMock).toHaveBeenCalledTimes(1);

    settings.destroy();
    expect(removeListenerMock).toHaveBeenCalledTimes(1);
  });
});
