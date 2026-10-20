// Resolves event target across Shadow DOM boundaries and normalizes text nodes

export function resolveTarget(event: Event): Element | null {
  const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
  const candidate: EventTarget | undefined = path[0] ?? event.target ?? undefined;

  if (!candidate) {
    return null;
  }

  const node = candidate as Node;
  if (node.nodeType === Node.TEXT_NODE) {
    return (node as Text).parentElement;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    return node as Element;
  }

  return null;
}
