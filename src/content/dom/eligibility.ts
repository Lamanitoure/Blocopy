import { INTERACTIVE_SELECTOR } from '../../shared/config/selectors.js';
import { closestLeafUnit } from './units.js';
import { findLevels } from './level-finder.js';

export interface EligibilityContext {
  readonly isSiteDisabled: boolean;
  readonly settingsLoaded: boolean;
}

// Checks if target element resides inside an interactive or editable control
export function isInteractiveElement(element: Element): boolean {
  return element.closest(INTERACTIVE_SELECTOR) !== null;
}

// Evaluates whether an event itself is eligible to start or mutate a session
function isEventAllowed(event: MouseEvent, context: EligibilityContext): boolean {
  if (!event.isTrusted || event.altKey) {
    return false;
  }
  return context.settingsLoaded && !context.isSiteDisabled;
}

// Evaluates whether the target DOM node satisfies all structural requirements
function isTargetAllowed(target: Element, boundary: Element): boolean {
  if (isInteractiveElement(target)) {
    return false;
  }

  const unit = closestLeafUnit(target, boundary);
  if (!unit) {
    return false;
  }

  const levels = findLevels(target);
  return levels.length > 0;
}

// Evaluates all guard rules from Spec Section 2.3
export function isEligible(
  event: MouseEvent,
  target: Element,
  context: EligibilityContext,
  boundary: Element
): boolean {
  if (!isEventAllowed(event, context)) {
    return false;
  }
  return isTargetAllowed(target, boundary);
}
