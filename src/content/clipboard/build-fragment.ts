import type { DOMPath } from '../../shared/types.js';
import { NON_CONTAINER_TAGS, UNIT_SELECTOR } from '../../shared/config/selectors.js';
import { getPath, resolvePath } from '../dom/paths.js';

// Compares DOMPaths in reverse document order for stable child removal
function comparePathsDescending(a: DOMPath, b: DOMPath): number {
  const minLength = Math.min(a.length, b.length);
  for (let i = 0; i < minLength; i += 1) {
    const valA = a[i] ?? 0;
    const valB = b[i] ?? 0;
    if (valB !== valA) {
      return valB - valA;
    }
  }
  return b.length - a.length;
}

// Determines if an element became completely empty and should be pruned
function isPrunable(el: Element): boolean {
  const isTargetTag = (NON_CONTAINER_TAGS as readonly string[]).includes(el.tagName) ||
    el.matches(UNIT_SELECTOR);
  if (!isTargetTag) {
    return false;
  }
  const textLen = el.textContent.trim().length;
  return textLen === 0 && el.querySelector('img') === null;
}

// Prunes empty container tags and leaf units iteratively until stable
function pruneEmptyNodes(root: Element): void {
  let changed = true;
  while (changed) {
    changed = false;
    const candidates = Array.from(root.querySelectorAll('*'));
    for (const candidate of candidates) {
      if (candidate.parentElement && isPrunable(candidate)) {
        candidate.parentElement.removeChild(candidate);
        changed = true;
      }
    }
  }
}

// Resolves and removes excluded elements inside cloned tree in reverse order
function removeExcludedNodes(clone: Element, paths: readonly DOMPath[]): void {
  const sorted = [...paths].sort(comparePathsDescending);
  for (const path of sorted) {
    if (path.length === 0) {
      clone.replaceChildren();
      continue;
    }
    const node = resolvePath(clone, path);
    if (node?.parentNode) {
      node.parentNode.removeChild(node);
    }
  }
}

// Builds an isolated DocumentFragment from container minus excluded units, with empty tag pruning
export function buildFragment(container: Element, excluded: readonly Element[]): DocumentFragment {
  const paths = excluded
    .filter((el) => container.contains(el))
    .map((el) => getPath(container, el));
  const clone = container.cloneNode(true) as Element;

  removeExcludedNodes(clone, paths);
  pruneEmptyNodes(clone);

  const doc = container.ownerDocument;
  const fragment = doc.createDocumentFragment();

  while (clone.firstChild !== null) {
    fragment.appendChild(clone.firstChild);
  }

  return fragment;
}
