import {
  MIN_UNITS_PER_CONTAINER,
  MAX_LEVELS,
  MAX_SELECTION_CHARS,
  REPEATED_SIBLINGS_THRESHOLD,
} from '../../shared/config/limits.js';
import {
  NON_CONTAINER_TAGS,
  HARD_STOP_TAGS,
  PREFERRED_CONTAINER_SELECTOR,
} from '../../shared/config/selectors.js';
import { closestLeafUnit, hasAtLeastLeafUnits } from './units.js';
import { exceedsTextBudget } from './bounded.js';

// Checks if element is a stop boundary where hierarchy climb must terminate
function isHardStop(node: Element): boolean {
  return (HARD_STOP_TAGS as readonly string[]).includes(node.tagName);
}

// Checks if tag groups units but should not be selected as a solitary container
function isNonContainer(node: Element): boolean {
  return (NON_CONTAINER_TAGS as readonly string[]).includes(node.tagName);
}

// Checks if child represents a repeated item within a list of similar siblings
function isRepeatedItem(parent: Element, child: Element): boolean {
  const targetClass = child.className.trim();
  if (targetClass.length === 0) {
    return false;
  }

  const targetTag = child.tagName;
  let count = 0;

  for (let i = 0; i < parent.children.length; i += 1) {
    const sibling = parent.children[i];
    if (sibling?.tagName === targetTag && sibling.className.trim() === targetClass) {
      count += 1;
      if (count >= REPEATED_SIBLINGS_THRESHOLD) {
        return true;
      }
    }
  }

  return false;
}

// Determines if an ancestor qualifies as a selectable container level
function shouldAddContainer(node: Element): boolean {
  const isCustomElement = node.tagName.includes('-');
  return hasAtLeastLeafUnits(node, MIN_UNITS_PER_CONTAINER) ||
    node.matches(PREFERRED_CONTAINER_SELECTOR) ||
    (isCustomElement && hasAtLeastLeafUnits(node, 1));
}

// Evaluates an ancestor and records it as candidate level; returns true if climbing should stop
function processContainerNode(current: Element, levels: Element[]): boolean {
  if (exceedsTextBudget(current, MAX_SELECTION_CHARS)) {
    return true;
  }

  if (shouldAddContainer(current) && !levels.includes(current)) {
    levels.push(current);
    if (levels.length === MAX_LEVELS) {
      return true;
    }
  }

  return false;
}

// Adds a standalone semantic or custom container as the first selectable level.
function addRootLevel(start: Element, levels: Element[]): boolean {
  const isCustomElement = start.tagName.includes('-');
  if (!start.matches(PREFERRED_CONTAINER_SELECTOR) && !isCustomElement) {
    return false;
  }
  if (exceedsTextBudget(start, MAX_SELECTION_CHARS)) {
    return true;
  }
  levels.push(start);
  return levels.length === MAX_LEVELS;
}

// Finds candidate selection container levels starting from target element up to MAX_LEVELS
export function findLevels(target: Element): Element[] {
  const start = closestLeafUnit(target, target.ownerDocument.body);
  if (start === null) {
    return [];
  }

  const levels: Element[] = [];
  if (addRootLevel(start, levels)) {
    return levels;
  }

  let child: Element = start;
  let current: Element | null = start.parentElement;

  while (current !== null && !isHardStop(current)) {
    if (isRepeatedItem(current, child)) {
      if (!levels.includes(child)) {
        levels.push(child);
      }
      break;
    }

    if (!isNonContainer(current) && processContainerNode(current, levels)) {
      break;
    }

    child = current;
    current = current.parentElement;
  }

  return levels;
}
