// Extension action popup controller (Spec Section 10.3)

import { DISABLED_HOSTS_KEY } from '../shared/config/storage-keys.js';
import { t } from '../shared/i18n.js';

interface PopupElements {
  readonly heading: HTMLElement;
  readonly toggleRow: HTMLElement;
  readonly checkbox: HTMLInputElement;
  readonly toggleLabel: HTMLElement;
  readonly unsupportedMsg: HTMLElement;
  readonly hint: HTMLElement;
}

// Queries required DOM elements in the popup
function getPopupElements(): PopupElements | null {
  const heading = document.getElementById('heading');
  const toggleRow = document.querySelector<HTMLElement>('.toggle-row');
  const checkbox = document.getElementById('site-toggle') as HTMLInputElement | null;
  const toggleLabel = document.getElementById('site-toggle-label');
  const unsupportedMsg = document.getElementById('unsupported-msg');
  const hint = document.getElementById('hint');

  if (!heading || !toggleRow || !checkbox || !toggleLabel || !unsupportedMsg || !hint) {
    return null;
  }

  return { heading, toggleRow, checkbox, toggleLabel, unsupportedMsg, hint };
}

// Applies localized text and direction to the popup interface
function applyStaticLocalization(elements: PopupElements): void {
  document.documentElement.dir = t('@@bidi_dir');
  elements.heading.textContent = t('popupHeading');
  elements.hint.textContent = t('popupHint');
}

// Safely parses and validates HTTP/HTTPS hostname from tab URL
function extractValidHostname(urlStr: string | undefined): string | null {
  if (!urlStr) {
    return null;
  }

  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.hostname.toLowerCase().trim();
    }
  } catch {
    return null;
  }

  return null;
}

// Loads currently disabled hosts array from extension local storage
async function readDisabledHosts(): Promise<string[]> {
  const result = (await browser.storage.local.get(DISABLED_HOSTS_KEY)) as Record<string, unknown>;
  const rawList: unknown = result[DISABLED_HOSTS_KEY];
  if (Array.isArray(rawList)) {
    return rawList.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

// Writes updated disabled hosts array to extension local storage
async function writeDisabledHosts(hosts: readonly string[]): Promise<void> {
  await browser.storage.local.set({ [DISABLED_HOSTS_KEY]: [...hosts] });
}

// Configures UI when the active tab is unsupported (non-HTTP or privileged)
function displayUnsupportedNotice(elements: PopupElements): void {
  elements.checkbox.disabled = true;
  elements.toggleRow.hidden = true;
  elements.unsupportedMsg.hidden = false;
  elements.unsupportedMsg.textContent = t('popupUnsupportedPage');
}

// Configures toggle control for supported hostname
async function configureToggleForHost(elements: PopupElements, hostname: string): Promise<void> {
  elements.toggleLabel.textContent = t('popupToggleLabel', hostname);

  const disabledHosts = await readDisabledHosts();
  elements.checkbox.checked = !disabledHosts.includes(hostname);

  elements.checkbox.addEventListener('change', () => {
    void (async () => {
      const current = await readDisabledHosts();
      const next = elements.checkbox.checked
        ? current.filter((h) => h !== hostname)
        : [...current.filter((h) => h !== hostname), hostname];
      await writeDisabledHosts(next);
    })();
  });
}

// Popup initialization entry point
async function initializePopup(): Promise<void> {
  const elements = getPopupElements();
  if (!elements) return;

  applyStaticLocalization(elements);

  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];
  const hostname = extractValidHostname(activeTab?.url);

  if (!hostname) {
    displayUnsupportedNotice(elements);
    return;
  }

  await configureToggleForHost(elements, hostname);
}

document.addEventListener('DOMContentLoaded', () => {
  void initializePopup();
});
