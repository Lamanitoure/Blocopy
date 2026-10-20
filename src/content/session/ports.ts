import type { ClipboardPayload, NotificationKind } from '../../shared/types.js';
import type { SessionAction } from './session-state.js';

// Visual highlighting port (Spec Section 9.2)
export interface Highlighter {
  show(ranges: readonly Range[]): void;
  clear(): void;
}

// System clipboard writing port (Spec Section 9.2)
export interface ClipboardPort {
  write(payload: ClipboardPayload): Promise<void>;
}

// User notification port for feedback toasts (Spec Section 9.2)
export interface Notifier {
  notify(kind: NotificationKind): void;
}

// Session event listener orchestration port (Spec Section 9.2 & 9.3)
export interface SessionListenerPort {
  attach(container: Element, dispatch: (action: SessionAction) => void): void;
  detach(): void;
}
