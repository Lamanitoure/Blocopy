// Common domain and port types for Blocopy

export type NotificationKind = 'copied' | 'failed' | 'empty';

export interface ClipboardPayload {
  readonly html: string;
  readonly text: string;
}

export type DOMPath = readonly number[];
