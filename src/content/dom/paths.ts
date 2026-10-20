import type { DOMPath } from '../../shared/types.js';

// Computes child index path from root node down to target node
export function getPath(root: Node, target: Node): DOMPath {
  if (target === root) {
    return [];
  }

  const indices: number[] = [];
  let current: Node = target;

  while (current !== root) {
    const parent: Node | null = current.parentNode;
    if (parent === null) {
      return [];
    }
    const index = Array.prototype.indexOf.call(parent.childNodes, current);
    indices.push(index);
    current = parent;
  }

  indices.reverse();
  return indices;
}

// Resolves a child index path starting from root node down to target node
export function resolvePath(root: Node, path: DOMPath): Node | null {
  let current: Node = root;

  for (const index of path) {
    const child: Node | undefined = current.childNodes[index];
    if (!child) {
      return null;
    }
    current = child;
  }

  return current;
}
