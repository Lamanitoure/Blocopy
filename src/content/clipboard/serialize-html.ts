// Serializes a DocumentFragment to an HTML string
// Spec R5 & 8.4: This is the ONLY file in the repository permitted to read innerHTML.

export function serializeHtml(fragment: DocumentFragment): string {
  const doc = fragment.ownerDocument;
  const wrapper = doc.createElement('div');
  wrapper.appendChild(fragment.cloneNode(true));
  return wrapper.innerHTML;
}
