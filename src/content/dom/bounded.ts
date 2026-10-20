// Bounded element counter using early-exit TreeWalker
export function hasAtLeast(root: Element, selector: string, n: number): boolean {
  if (n <= 0) {
    return true;
  }

  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let count = 0;

  while (walker.nextNode() !== null) {
    const el = walker.currentNode as Element;
    if (el.matches(selector)) {
      count += 1;
      if (count >= n) {
        return true;
      }
    }
  }

  return false;
}

// Bounded text length counter using early-exit TreeWalker
export function exceedsTextBudget(root: Element, max: number): boolean {
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let totalLength = 0;

  while (walker.nextNode() !== null) {
    const textNode = walker.currentNode as Text;
    totalLength += textNode.data.length;
    if (totalLength > max) {
      return true;
    }
  }

  return false;
}
