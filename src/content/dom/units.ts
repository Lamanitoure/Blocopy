import { UNIT_SELECTOR } from '../../shared/config/selectors.js';

// Checks if an element is a leaf unit matching UNIT_SELECTOR with no nested units
export function isLeafUnit(el: Element): boolean {
  return el.matches(UNIT_SELECTOR) && el.querySelector(UNIT_SELECTOR) === null;
}

// Finds the closest leaf unit ancestor within the given boundary element
export function closestLeafUnit(from: Element, within: Element): Element | null {
  const candidate = from.closest(UNIT_SELECTOR);
  if (candidate === null) {
    return null;
  }
  if (!within.contains(candidate)) {
    return null;
  }
  if (!isLeafUnit(candidate)) {
    return null;
  }
  return candidate;
}

// Lists all leaf unit elements inside root in document order
export function listLeafUnits(root: Element): Element[] {
  const elements = isLeafUnit(root)
    ? [root, ...Array.from(root.querySelectorAll(UNIT_SELECTOR))]
    : Array.from(root.querySelectorAll(UNIT_SELECTOR));
  return elements.filter((el) => isLeafUnit(el));
}
