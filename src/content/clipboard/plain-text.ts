// Formats blockquote lines with markdown prefix
function renderBlockquote(el: Element): string {
  const inner = renderChildren(el).replace(/\n{3,}/g, '\n\n').trim();
  const lines = inner.split('\n');
  const prefixed = lines.map((line) => {
    return line.length > 0 ? `> ${line}` : '>';
  });
  return `\n\n${prefixed.join('\n')}\n\n`;
}

// Formats ordered or unordered list items
function renderList(el: Element, isOrdered: boolean): string {
  const startAttr = el.getAttribute('start');
  let counter = startAttr ? parseInt(startAttr, 10) : 1;
  let result = '\n\n';

  for (let i = 0; i < el.children.length; i += 1) {
    const child = el.children[i];
    if (child?.tagName.toLowerCase() === 'li') {
      const itemText = renderChildren(child).trim();
      if (isOrdered) {
        result += `${String(counter)}. ${itemText}\n`;
        counter += 1;
      } else {
        result += `- ${itemText}\n`;
      }
    }
  }

  return `${result}\n\n`;
}

// Renders an Element node to plain text based on semantics
function renderElement(el: Element): string {
  const tag = el.tagName.toLowerCase();

  if (tag === 'br') {
    return '\n';
  }
  if (tag === 'pre') {
    return `\n\n${el.textContent}\n\n`;
  }
  if (tag === 'blockquote') {
    return renderBlockquote(el);
  }
  if (tag === 'ul') {
    return renderList(el, false);
  }
  if (tag === 'ol') {
    return renderList(el, true);
  }
  if (tag === 'p' || /^h[1-6]$/.test(tag)) {
    const text = renderChildren(el).trim();
    return `\n\n${text}\n\n`;
  }

  return renderChildren(el);
}

// Recursively walks child nodes and concatenates rendered text
function renderChildren(parent: Node): string {
  let result = '';
  for (let i = 0; i < parent.childNodes.length; i += 1) {
    const child = parent.childNodes[i];
    if (!child) continue;

    if (child.nodeType === Node.TEXT_NODE) {
      const text = (child as Text).data.replace(/[ \t\r\n]+/g, ' ');
      result += text;
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      result += renderElement(child as Element);
    }
  }
  return result;
}

// Converts a sanitized DocumentFragment to plain text with structured formatting
export function toPlainText(fragment: DocumentFragment): string {
  const raw = renderChildren(fragment);
  const normalizedNewlines = raw.replace(/\n{3,}/g, '\n\n');
  return normalizedNewlines.replace(/^[\r\n]+/, '').replace(/[\r\n]+$/, '');
}
