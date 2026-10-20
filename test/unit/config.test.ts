import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  MIN_UNITS_PER_CONTAINER,
  MAX_LEVELS,
  MAX_SELECTION_CHARS,
  REPEATED_SIBLINGS_THRESHOLD,
  MAX_TOAST_STACK,
} from '../../src/shared/config/limits.js';
import {
  UNIT_SELECTOR,
  INTERACTIVE_SELECTOR,
  NON_CONTAINER_TAGS,
  HARD_STOP_TAGS,
  PREFERRED_CONTAINER_SELECTOR,
} from '../../src/shared/config/selectors.js';
import { DISABLED_HOSTS_KEY } from '../../src/shared/config/storage-keys.js';
import {
  ALLOWED_TAGS,
  ALLOWED_ATTRIBUTES,
  ALLOWED_URL_PROTOCOLS,
  ALLOWED_IMG_PROTOCOLS,
  DROP_WITH_CONTENT_SELECTOR,
} from '../../src/shared/config/sanitize-policy.js';
import {
  HIGHLIGHT_NAME,
  TOAST_DURATION_MS,
  TOAST_HOST_TAG,
  NOTIFICATION_I18N_KEYS,
} from '../../src/shared/config/ui.js';

describe('Configuration Modules (Spec Section 7)', () => {
  it('defines limits matching spec', () => {
    expect(MIN_UNITS_PER_CONTAINER).toBe(2);
    expect(MAX_LEVELS).toBe(4);
    expect(MAX_SELECTION_CHARS).toBe(200_000);
    expect(REPEATED_SIBLINGS_THRESHOLD).toBe(3);
    expect(MAX_TOAST_STACK).toBe(1);
  });

  it('defines selectors matching spec', () => {
    expect(UNIT_SELECTOR).toBe('p, li, h1, h2, h3, h4, h5, h6, blockquote, pre, dt, dd, figcaption');
    expect(INTERACTIVE_SELECTOR).toContain('input');
    expect(INTERACTIVE_SELECTOR).toContain('[contenteditable]');
    expect(NON_CONTAINER_TAGS).toContain('UL');
    expect(NON_CONTAINER_TAGS).toContain('TABLE');
    expect(HARD_STOP_TAGS).toContain('BODY');
    expect(HARD_STOP_TAGS).toContain('HTML');
    expect(PREFERRED_CONTAINER_SELECTOR).toBe('article, [role="article"], blockquote, details');
  });

  it('defines storage keys matching spec', () => {
    expect(DISABLED_HOSTS_KEY).toBe('disabledHosts');
  });

  it('defines sanitize policy matching spec', () => {
    expect(ALLOWED_TAGS).toContain('p');
    expect(ALLOWED_TAGS).toContain('a');
    expect(ALLOWED_TAGS).not.toContain('script');
    expect(ALLOWED_ATTRIBUTES['a']).toEqual(['href', 'title']);
    expect(ALLOWED_ATTRIBUTES['img']).toEqual(['src', 'alt', 'width', 'height']);
    expect(ALLOWED_URL_PROTOCOLS).toContain('https:');
    expect(ALLOWED_URL_PROTOCOLS).toContain('mailto:');
    expect(ALLOWED_IMG_PROTOCOLS).toEqual(['http:', 'https:']);
    expect(DROP_WITH_CONTENT_SELECTOR).toContain('script');
  });

  it('defines ui constants and maps NotificationKind to i18n keys', () => {
    expect(HIGHLIGHT_NAME).toBe('blocopy-selection');
    expect(TOAST_DURATION_MS).toBe(1200);
    expect(TOAST_HOST_TAG).toBe('blocopy-toast');
    expect(NOTIFICATION_I18N_KEYS.copied).toBe('toastCopied');
    expect(NOTIFICATION_I18N_KEYS.failed).toBe('toastCopyFailed');
    expect(NOTIFICATION_I18N_KEYS.empty).toBe('toastNothingLeft');
  });

  it('verifies that content.css contains ::highlight(${HIGHLIGHT_NAME})', () => {
    const cssPath = path.join(process.cwd(), 'src', 'content', 'content.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toContain(`::highlight(${HIGHLIGHT_NAME})`);
  });
});
