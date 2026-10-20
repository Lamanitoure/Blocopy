// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { toPlainText } from '../../src/content/clipboard/plain-text.js';

describe('Plain-Text Rendering (Spec Section 8.5)', () => {
  // 1. Two paragraphs produce two lines separated by an empty line
  it('1. Two paragraphs produce two lines separated by an empty line', () => {
    const fragment = document.createDocumentFragment();
    const p1 = document.createElement('p');
    p1.textContent = 'First paragraph';
    const p2 = document.createElement('p');
    p2.textContent = 'Second paragraph';
    fragment.append(p1, p2);

    expect(toPlainText(fragment)).toBe('First paragraph\n\nSecond paragraph');
  });

  // 2. An ordered list with 3 items produces 1. ...\n2. ...\n3. ...
  it('2. An ordered list with 3 items produces 1. ...\\n2. ...\\n3. ...', () => {
    const fragment = document.createDocumentFragment();
    const ol = document.createElement('ol');
    for (let i = 1; i <= 3; i += 1) {
      const li = document.createElement('li');
      li.textContent = `Item ${String(i)}`;
      ol.appendChild(li);
    }
    fragment.appendChild(ol);

    expect(toPlainText(fragment)).toBe('1. Item 1\n2. Item 2\n3. Item 3');
  });

  // 3. An ordered list with start="5" produces 5. ...\n6. ...
  it('3. An ordered list with start="5" produces 5. ...\\n6. ...', () => {
    const fragment = document.createDocumentFragment();
    const ol = document.createElement('ol');
    ol.setAttribute('start', '5');
    const li1 = document.createElement('li');
    li1.textContent = 'Fifth item';
    const li2 = document.createElement('li');
    li2.textContent = 'Sixth item';
    ol.append(li1, li2);
    fragment.appendChild(ol);

    expect(toPlainText(fragment)).toBe('5. Fifth item\n6. Sixth item');
  });

  // 4. A blockquote with 2 paragraphs produces > p1\n>\n> p2
  it('4. A blockquote with 2 paragraphs produces > p1\\n>\\n> p2', () => {
    const fragment = document.createDocumentFragment();
    const bq = document.createElement('blockquote');
    const p1 = document.createElement('p');
    p1.textContent = 'First quote';
    const p2 = document.createElement('p');
    p2.textContent = 'Second quote';
    bq.append(p1, p2);
    fragment.appendChild(bq);

    expect(toPlainText(fragment)).toBe('> First quote\n>\n> Second quote');
  });

  // 5. Consecutive whitespace in inline text is collapsed to a single space
  it('5. Consecutive whitespace in inline text is collapsed to a single space', () => {
    const fragment = document.createDocumentFragment();
    const p = document.createElement('p');
    p.textContent = 'Hello   \t\n   beautiful    world';
    fragment.appendChild(p);

    expect(toPlainText(fragment)).toBe('Hello beautiful world');
  });

  // 6. A pre block with whitespace and newlines is preserved verbatim
  it('6. A pre block with whitespace and newlines is preserved verbatim', () => {
    const fragment = document.createDocumentFragment();
    const pre = document.createElement('pre');
    pre.textContent = '  function test() {\n    return 42;\n  }';
    fragment.appendChild(pre);

    expect(toPlainText(fragment)).toBe('  function test() {\n    return 42;\n  }');
  });
});
