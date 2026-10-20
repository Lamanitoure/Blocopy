interface TextSegment {
  readonly start: Text;
  end: Text;
}

// Creates a Range spanning from start text node offset 0 to end text node end
function createRangeFromSegment(doc: Document, startNode: Text, endNode: Text): Range {
  const range = doc.createRange();
  range.setStart(startNode, 0);
  range.setEnd(endNode, endNode.data.length);
  return range;
}

// Computes minimal Range objects covering container text while skipping excluded units
export function computeRanges(container: Element, excluded: readonly Element[]): Range[] {
  const doc = container.ownerDocument;

  if (excluded.length === 0) {
    const range = doc.createRange();
    range.selectNodeContents(container);
    return [range];
  }

  const ranges: Range[] = [];
  const walker = doc.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let currentSegment: TextSegment | null = null;

  while (walker.nextNode() !== null) {
    const textNode = walker.currentNode as Text;
    const isExcluded = excluded.some((el) => el.contains(textNode));

    if (isExcluded) {
      if (currentSegment !== null) {
        ranges.push(createRangeFromSegment(doc, currentSegment.start, currentSegment.end));
        currentSegment = null;
      }
    } else {
      if (currentSegment === null) {
        currentSegment = { start: textNode, end: textNode };
      } else {
        currentSegment.end = textNode;
      }
    }
  }

  if (currentSegment !== null) {
    ranges.push(createRangeFromSegment(doc, currentSegment.start, currentSegment.end));
  }

  return ranges;
}
