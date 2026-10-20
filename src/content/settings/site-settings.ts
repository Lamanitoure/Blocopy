// Site settings management and storage synchronization (Spec Section 10.3)

import { DISABLED_HOSTS_KEY } from '../../shared/config/storage-keys.js';

export interface StorageChangeDetails {
  readonly oldValue?: unknown;
  readonly newValue?: unknown;
}

export interface StorageArea {
  get(keys: string): Promise<Record<string, unknown>>;
  set?(items: Record<string, unknown>): Promise<void>;
}

export interface StorageOnChanged {
  addListener(listener: (changes: Record<string, StorageChangeDetails>, areaName: string) => void): void;
  removeListener(listener: (changes: Record<string, StorageChangeDetails>, areaName: string) => void): void;
}

export interface StorageAdapter {
  readonly local: StorageArea;
  readonly onChanged: StorageOnChanged;
}

type DisabledChangeListener = (disabled: boolean) => void;

// Manages site enablement status backed by browser.storage.local
export class SiteSettingsManager {
  private readonly storage: StorageAdapter | null;
  private readonly disabledHosts = new Set<string>();
  private readonly listeners = new Map<string, Set<DisabledChangeListener>>();
  private isLoaded = false;
  private initPromise: Promise<void> | null = null;
  private readonly storageListener: (changes: Record<string, StorageChangeDetails>, areaName: string) => void;

  public constructor(customStorage?: StorageAdapter) {
    this.storage = customStorage ?? (typeof browser !== 'undefined' ? browser.storage : null);

    this.storageListener = (changes, areaName) => {
      this.handleStorageChange(changes, areaName);
    };

    if (this.storage) {
      this.storage.onChanged.addListener(this.storageListener);
      this.initPromise = this.loadSettings();
    } else {
      this.isLoaded = true;
    }
  }

  // Parses raw stored hosts into the in-memory set
  private updateDisabledHosts(rawHosts: unknown): void {
    this.disabledHosts.clear();
    if (Array.isArray(rawHosts)) {
      for (const item of rawHosts) {
        if (typeof item === 'string') {
          this.disabledHosts.add(item.toLowerCase().trim());
        }
      }
    }
  }

  // Asynchronously loads initial disabled hosts from storage
  private async loadSettings(): Promise<void> {
    if (!this.storage) return;

    try {
      const data = await this.storage.local.get(DISABLED_HOSTS_KEY);
      this.updateDisabledHosts(data[DISABLED_HOSTS_KEY]);
    } finally {
      this.isLoaded = true;
    }
  }

  // Notifies all subscribed listeners for affected hosts
  private notifyListeners(): void {
    for (const [hostname, callbackSet] of this.listeners.entries()) {
      const disabled = this.isSiteDisabled(hostname);
      for (const callback of callbackSet) {
        callback(disabled);
      }
    }
  }

  // Handles storage change events from browser.storage.onChanged
  private handleStorageChange(changes: Record<string, StorageChangeDetails>, areaName: string): void {
    if (areaName !== 'local' && areaName.length > 0) return;

    const change = changes[DISABLED_HOSTS_KEY];
    if (change && 'newValue' in change) {
      this.updateDisabledHosts(change.newValue);
      this.notifyListeners();
    }
  }

  // Awaits initialization completion
  public async init(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  // Returns true if settings have loaded and the hostname is not disabled
  public isEnabled(hostname: string): boolean {
    if (!this.isLoaded) {
      return false;
    }
    const normalized = hostname.toLowerCase().trim();
    return !this.disabledHosts.has(normalized);
  }

  // Returns true if the site is considered disabled (including uninitialized state)
  public isSiteDisabled(hostname: string): boolean {
    return !this.isEnabled(hostname);
  }

  // Subscribes to changes in enablement status for a specific hostname
  public onSiteDisabledChange(hostname: string, callback: DisabledChangeListener): () => void {
    const normalized = hostname.toLowerCase().trim();
    let set = this.listeners.get(normalized);
    if (!set) {
      set = new Set();
      this.listeners.set(normalized, set);
    }
    set.add(callback);

    return () => {
      const currentSet = this.listeners.get(normalized);
      currentSet?.delete(callback);
      if (currentSet?.size === 0) {
        this.listeners.delete(normalized);
      }
    };
  }

  // Detaches storage listeners and cleans up registered subscriptions
  public destroy(): void {
    if (this.storage) {
      this.storage.onChanged.removeListener(this.storageListener);
    }
    this.listeners.clear();
  }
}
