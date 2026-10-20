// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { buildFragment } from '../../src/content/clipboard/build-fragment.js';

describe('Fragment Building (Spec Section 8.3)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('removes excluded units from cloned fragment without modifying live DOM', () => {
    const article = document.createElement('article');
    const p1 = document.createElement('p');
    p1.textContent = 'Keep 1';
    const p2 = document.createElement('p');
    p2.textContent = 'Exclude me';
    const p3 = document.createElement('p');
    p3.textContent = 'Keep 2';
    article.append(p1, p2, p3);
    document.body.appendChild(article);

    const fragment = buildFragment(article, [p2]);

    // Live DOM untouched
    expect(article.children.length).toBe(3);
    expect(article.contains(p2)).toBe(true);

    // Fragment has excluded element removed
    expect(fragment.children.length).toBe(2);
    expect(fragment.children[0]?.textContent).toBe('Keep 1');
    expect(fragment.children[1]?.textContent).toBe('Keep 2');
  });

  it('prunes elements that became empty (no text and no img) and are in NON_CONTAINER_TAGS or UNIT_SELECTOR', () => {
    const div = document.createElement('div');
    const p1 = document.createElement('p');
    p1.textContent = 'Before list';

    const ul = document.createElement('ul');
    const li1 = document.createElement('li');
    li1.textContent = 'Item 1';
    const li2 = document.createElement('li');
    li2.textContent = 'Item 2';
    ul.append(li1, li2);

    div.append(p1, ul);
    document.body.appendChild(div);

    // Exclude both li items
    const fragment = buildFragment(div, [li1, li2]);

    // Both li items removed -> ul became empty -> ul is in NON_CONTAINER_TAGS -> ul pruned!
    expect(fragment.querySelector('ul')).toBeNull();
    expect(fragment.children.length).toBe(1);
    expect(fragment.children[0]?.textContent).toBe('Before list');
  });

  it('preserves empty-text elements if they contain an img', () => {
    const div = document.createElement('div');
    const p1 = document.createElement('p');
    const img = document.createElement('img');
    img.src = 'https://example.com/pic.png';
    p1.appendChild(img);

    const p2 = document.createElement('p');
    p2.textContent = 'Text to exclude';

    div.append(p1, p2);
    document.body.appendChild(div);

    const fragment = buildFragment(div, [p2]);

    // p1 has no text but has img, so it must not be pruned
    expect(fragment.querySelector('p')).not.toBeNull();
    expect(fragment.querySelector('img')).not.toBeNull();
  });
});
