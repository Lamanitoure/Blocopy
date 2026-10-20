import {
  ALLOWED_TAGS,
  ALLOWED_ATTRIBUTES,
  ALLOWED_URL_PROTOCOLS,
  ALLOWED_IMG_PROTOCOLS,
  DROP_WITH_CONTENT_SELECTOR,
} from '../../shared/config/sanitize-policy.js';

// Parses and validates URL against protocol allowlist
function cleanUrl(value: string, baseURI: string, allowedProtocols: readonly string[]): string | null {
  try {
    const url = new URL(value, baseURI);
    if (allowedProtocols.includes(url.protocol)) {
      return url.href;
    }
  } catch {
    // Malformed URLs are dropped
  }
  return null;
}

// Copies only allowed attributes to fresh target element with URL validation
function copyAllowedAttributes(source: Element, target: Element, tag: string, baseURI: string): void {
  const allowed = ALLOWED_ATTRIBUTES[tag];
  if (!allowed) {
    return;
  }

  for (const attr of allowed) {
    const val = source.getAttribute(attr);
    if (val === null) {
      continue;
    }

    if (attr === 'src' && tag === 'img') {
      const clean = cleanUrl(val, baseURI, ALLOWED_IMG_PROTOCOLS);
      if (clean !== null) {
        target.setAttribute('src', clean);
      }
    } else if (attr === 'href' && tag === 'a') {
      const clean = cleanUrl(val, baseURI, ALLOWED_URL_PROTOCOLS);
      if (clean !== null) {
        target.setAttribute('href', clean);
      }
    } else {
      target.setAttribute(attr, val);
    }
  }
}

// Recursively sanitizes element nodes through allowlist element re-creation
function sanitizeElement(el: Element, targetParent: Node, doc: Document): void {
  if (el.matches(DROP_WITH_CONTENT_SELECTOR)) {
    return;
  }

  const tag = el.tagName.toLowerCase();
  const isAllowedTag = (ALLOWED_TAGS as readonly string[]).includes(tag);

  if (!isAllowedTag) {
    for (let i = 0; i < el.childNodes.length; i += 1) {
      const child = el.childNodes[i];
      if (child) {
        sanitizeNode(child, targetParent, doc);
      }
    }
    return;
  }

  const fresh = doc.createElement(tag);
  copyAllowedAttributes(el, fresh, tag, doc.baseURI);

  for (let i = 0; i < el.childNodes.length; i += 1) {
    const child = el.childNodes[i];
    if (child) {
      sanitizeNode(child, fresh, doc);
    }
  }

  targetParent.appendChild(fresh);
}

// Sanitizes a DOM node by type, discarding comments and disallowed nodes
function sanitizeNode(node: Node, targetParent: Node, doc: Document): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    sanitizeElement(node as Element, targetParent, doc);
  } else if (node.nodeType === Node.TEXT_NODE) {
    const textNode = node as Text;
    targetParent.appendChild(doc.createTextNode(textNode.data));
  }
}

// Sanitizes a DocumentFragment using strict node re-creation allowlist
export function sanitize(fragment: DocumentFragment): DocumentFragment {
  const doc = fragment.ownerDocument;
  const out = doc.createDocumentFragment();

  for (let i = 0; i < fragment.childNodes.length; i += 1) {
    const child = fragment.childNodes[i];
    if (child) {
      sanitizeNode(child, out, doc);
    }
  }

  return out;
}
