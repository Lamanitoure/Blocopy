import type { SessionListenerPort } from '../session/ports.js';
import type { SessionAction } from '../session/session-state.js';
import { resolveTarget } from '../dom/target.js';
import { isInteractiveElement } from '../dom/eligibility.js';
import { closestLeafUnit } from '../dom/units.js';

// Verifies if mouse click is an unmodified plain left click with single click detail
function isPlainLeftClick(event: MouseEvent): boolean {
  if (event.button !== 0 || event.detail !== 1) {
    return false;
  }
  return !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}

// Handles capture click event according to gesture rules in Spec Section 2.2
function handleClick(
  event: MouseEvent,
  container: Element,
  dispatch: (action: SessionAction) => void
): void {
  const target = resolveTarget(event);
  if (!target) return;

  if (!container.contains(target)) {
    dispatch({ type: 'end' });
    return;
  }

  if (isInteractiveElement(target)) {
    return;
  }

  if (!isPlainLeftClick(event)) {
    return;
  }

  const unit = closestLeafUnit(target, container);
  if (unit && container.contains(unit)) {
    event.preventDefault();
    event.stopPropagation();
    dispatch({ type: 'toggle', unit });
  }
}

// Prevents word selection flicker when double clicking inside an active container
function handleMouseDown(event: MouseEvent, container: Element): void {
  if (event.detail > 1) {
    const target = resolveTarget(event);
    if (target && container.contains(target)) {
      event.preventDefault();
    }
  }
}

// Handles Escape key to step down container levels without blocking native event
function handleKeyDown(event: KeyboardEvent, dispatch: (action: SessionAction) => void): void {
  if (event.key === 'Escape') {
    dispatch({ type: 'back' });
  }
}

// Manages session event listeners lifecycle via a single AbortController per session
export class DomSessionListeners implements SessionListenerPort {
  private abortController: AbortController | null = null;

  constructor(private readonly doc: Document = document) {}

  attach(container: Element, dispatch: (action: SessionAction) => void): void {
    this.detach();
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.doc.addEventListener('click', (event: MouseEvent) => {
      handleClick(event, container, dispatch);
    }, { capture: true, signal });

    this.doc.addEventListener('mousedown', (event: MouseEvent) => {
      handleMouseDown(event, container);
    }, { capture: true, signal });

    this.doc.addEventListener('keydown', (event: KeyboardEvent) => {
      handleKeyDown(event, dispatch);
    }, { capture: true, signal });
  }

  detach(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
