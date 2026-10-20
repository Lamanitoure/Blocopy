// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { sanitize } from '../../src/content/clipboard/sanitize.js';
import { serializeHtml } from '../../src/content/clipboard/serialize-html.js';

describe('Sanitization and HTML Serialization (Spec Section 8.4)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  // 1. p with text -> preserved as p with identical text
  it('1. p with text -> preserved as p with identical text', () => {
    const fragment = document.createDocumentFragment();
    const p = document.createElement('p');
    p.textContent = 'Hello world';
    fragment.appendChild(p);

    const sanitized = sanitize(fragment);
    const html = serializeHtml(sanitized);
    expect(html).toBe('<p>Hello world</p>');
  });

  // 2. div.prose > p -> div has no class; p preserved
  it('2. div.prose > p -> div has no class; p preserved', () => {
    const fragment = document.createDocumentFragment();
    const div = document.createElement('div');
    div.className = 'prose text-red-500';
    const p = document.createElement('p');
    p.textContent = 'Paragraph';
    div.appendChild(p);
    fragment.appendChild(div);

    const sanitized = sanitize(fragment);
    const html = serializeHtml(sanitized);
    expect(html).toBe('<div><p>Paragraph</p></div>');
    expect(sanitized.querySelector('div')?.getAttribute('class')).toBeNull();
  });

  // 3. <script> and its text are completely dropped
  it('3. <script> and its text are completely dropped', () => {
    const fragment = document.createDocumentFragment();
    const script = document.createElement('script');
    script.textContent = 'console.log("malicious")';
    const p = document.createElement('p');
    p.textContent = 'Safe';
    fragment.append(script, p);

    const sanitized = sanitize(fragment);
    const html = serializeHtml(sanitized);
    expect(html).toBe('<p>Safe</p>');
    expect(html).not.toContain('malicious');
  });

  // 4. <a href="javascript:alert(1)"> -> <a> is kept, href is removed
  it('4. <a href="javascript:alert(1)"> -> <a> is kept, href is removed', () => {
    const fragment = document.createDocumentFragment();
    const a = document.createElement('a');
    a.setAttribute('href', 'javascript:alert(1)');
    a.textContent = 'Click me';
    fragment.appendChild(a);

    const sanitized = sanitize(fragment);
    const html = serializeHtml(sanitized);
    expect(html).toBe('<a>Click me</a>');
    expect(sanitized.querySelector('a')?.hasAttribute('href')).toBe(false);
  });

  // 5. <a href="https://example.com" onclick="..."> -> href kept, onclick removed
  it('5. <a href="https://example.com/" onclick="..."> -> href kept, onclick removed', () => {
    const fragment = document.createDocumentFragment();
    const a = document.createElement('a');
    a.setAttribute('href', 'https://example.com/');
    a.setAttribute('onclick', 'alert(1)');
    a.textContent = 'Example Link';
    fragment.appendChild(a);

    const sanitized = sanitize(fragment);
    const html = serializeHtml(sanitized);
    expect(html).toBe('<a href="https://example.com/">Example Link</a>');
    expect(sanitized.querySelector('a')?.hasAttribute('onclick')).toBe(false);
  });

  // 6. custom-element > p -> custom-element tag dropped, p kept
  it('6. custom-element > p -> custom-element tag dropped, p kept', () => {
    const fragment = document.createDocumentFragment();
    const custom = document.createElement('custom-element');
    const p = document.createElement('p');
    p.textContent = 'Inside custom element';
    custom.appendChild(p);
    fragment.appendChild(custom);

    const sanitized = sanitize(fragment);
    const html = serializeHtml(sanitized);
    expect(html).toBe('<p>Inside custom element</p>');
    expect(sanitized.querySelector('custom-element')).toBeNull();
  });

  // 7. Nested span with style="..." -> span kept without style
  it('7. Nested span with style="..." -> span kept without style', () => {
    const fragment = document.createDocumentFragment();
    const p = document.createElement('p');
    const span = document.createElement('span');
    span.setAttribute('style', 'color: red; font-size: 20px;');
    span.textContent = 'Styled span';
    p.appendChild(span);
    fragment.appendChild(p);

    const sanitized = sanitize(fragment);
    const html = serializeHtml(sanitized);
    expect(html).toBe('<p><span>Styled span</span></p>');
    expect(sanitized.querySelector('span')?.hasAttribute('style')).toBe(false);
  });

  // 8. img with data: src is dropped or src removed; img with https: is preserved
  it('8. img with data: src has src removed; img with https: is preserved', () => {
    const fragment = document.createDocumentFragment();
    const badImg = document.createElement('img');
    badImg.setAttribute('src', 'data:image/png;base64,AAAA');
    badImg.setAttribute('alt', 'Data image');

    const goodImg = document.createElement('img');
    goodImg.setAttribute('src', 'https://example.com/logo.png');
    goodImg.setAttribute('alt', 'Safe logo');

    fragment.append(badImg, goodImg);

    const sanitized = sanitize(fragment);
    const imgs = sanitized.querySelectorAll('img');
    expect(imgs.length).toBe(2);
    expect(imgs[0]?.hasAttribute('src')).toBe(false);
    expect(imgs[0]?.getAttribute('alt')).toBe('Data image');
    expect(imgs[1]?.getAttribute('src')).toBe('https://example.com/logo.png');
    expect(imgs[1]?.getAttribute('alt')).toBe('Safe logo');
  });
});
