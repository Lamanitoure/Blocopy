import type { NotificationKind } from '../types.js';

// Identifier registered with the CSS Custom Highlight API
export const HIGHLIGHT_NAME = 'blocopy-selection' as const;

// Visible duration in milliseconds for notification toasts before dismissal
export const TOAST_DURATION_MS = 1200;

// Custom element tag name for the isolated shadow host toast container
export const TOAST_HOST_TAG = 'blocopy-toast' as const;

// Mapping of internal notification kinds to localized message bundle keys
export const NOTIFICATION_I18N_KEYS: Readonly<Record<NotificationKind, string>> = {
  copied: 'toastCopied',
  failed: 'toastCopyFailed',
  empty: 'toastNothingLeft',
} as const;
