import { UNIT_SELECTOR } from '../../shared/config/selectors.js';

// Detects whether an element contains non-whitespace text.
function hasText(el: Element): boolean {
  return el.textContent.trim().length > 0;
}

// Treat divs and custom elements as generic blocks when they own text content.
function isGenericBlock(el: Element): boolean {
  return el.tagName === 'DIV' || el.tagName.includes('-');
}

// A generic text block has text but no nested generic block that owns that text.
function isGenericTextUnit(el: Element): boolean {
  if (!isGenericBlock(el) || el.querySelector(UNIT_SELECTOR) !== null) {
    return false;
  }

  const hasNestedTextBlock = Array.from(el.querySelectorAll('*')).some((child) => {
    return isGenericBlock(child) && hasText(child);
  });
  return hasText(el) && !hasNestedTextBlock;
}

// Checks whether an element is a semantic or generic leaf text unit.
export function isLeafUnit(el: Element): boolean {
  const isSemanticUnit = el.matches(UNIT_SELECTOR) && el.querySelector(UNIT_SELECTOR) === null;
  return isSemanticUnit || isGenericTextUnit(el);
}

// Finds the closest leaf unit ancestor within the given boundary element
export function closestLeafUnit(from: Element, within: Element): Element | null {
  let candidate: Element | null = from;
  while (candidate !== null && within.contains(candidate)) {
    if (isLeafUnit(candidate)) {
      return candidate;
    }
    if (candidate === within) {
      break;
    }
    candidate = candidate.parentElement;
  }
  return null;
}

// Lists all leaf unit elements inside root in document order
export function listLeafUnits(root: Element): Element[] {
  const elements = [root, ...Array.from(root.querySelectorAll('*'))];
  return elements.filter((el) => isLeafUnit(el));
}

// Counts leaf text units with an early exit while preserving bounded DOM traversal.
export function hasAtLeastLeafUnits(root: Element, n: number): boolean {
  if (n <= 0) {
    return true;
  }

  let count = isLeafUnit(root) ? 1 : 0;
  if (count >= n) {
    return true;
  }

  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  while (walker.nextNode() !== null) {
    if (isLeafUnit(walker.currentNode as Element)) {
      count += 1;
      if (count >= n) {
        return true;
      }
    }
  }

  return false;
}
