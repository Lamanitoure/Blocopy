// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { getPath, resolvePath } from '../../src/content/dom/paths.js';
import { hasAtLeast, exceedsTextBudget } from '../../src/content/dom/bounded.js';
import { isLeafUnit, closestLeafUnit, listLeafUnits } from '../../src/content/dom/units.js';

describe('DOM Helpers: paths, bounded, units', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('paths.ts', () => {
    it('computes and resolves path from root to child node', () => {
      const container = document.createElement('div');
      container.innerHTML = '<p>First</p><p>Second <span>nested</span></p>';
      document.body.appendChild(container);

      const span = container.querySelector('span');
      expect(span).not.toBeNull();

      const path = getPath(container, span as Node);
      expect(path).toEqual([1, 1]); // second child (index 1), second child within it (text is 0, span is 1)

      const resolved = resolvePath(container, path);
      expect(resolved).toBe(span);
    });

    it('returns empty path for root itself and resolves to root', () => {
      const container = document.createElement('div');
      const path = getPath(container, container);
      expect(path).toEqual([]);
      expect(resolvePath(container, path)).toBe(container);
    });

    it('returns null if path cannot be resolved', () => {
      const container = document.createElement('div');
      container.innerHTML = '<p>Hello</p>';
      expect(resolvePath(container, [5, 2])).toBeNull();
    });
  });

  describe('bounded.ts', () => {
    it('hasAtLeast returns true as soon as count reaches n, and false otherwise', () => {
      const container = document.createElement('div');
      container.innerHTML = '<p>One</p><p>Two</p><p>Three</p>';

      expect(hasAtLeast(container, 'p', 1)).toBe(true);
      expect(hasAtLeast(container, 'p', 2)).toBe(true);
      expect(hasAtLeast(container, 'p', 3)).toBe(true);
      expect(hasAtLeast(container, 'p', 4)).toBe(false);
      expect(hasAtLeast(container, 'span', 1)).toBe(false);
    });

    it('exceedsTextBudget returns true when text length exceeds limit', () => {
      const container = document.createElement('div');
      container.innerHTML = '<p>12345</p><p>67890</p>';

      expect(exceedsTextBudget(container, 5)).toBe(true); // total 10 > 5
      expect(exceedsTextBudget(container, 10)).toBe(false);
      expect(exceedsTextBudget(container, 20)).toBe(false);
    });
  });

  describe('units.ts', () => {
    it('isLeafUnit matches UNIT_SELECTOR and contains no nested units', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <p id="leaf-p">Leaf paragraph</p>
        <blockquote id="nested-quote"><p>Nested paragraph</p></blockquote>
        <div id="not-unit">Not unit</div>
      `;
      document.body.appendChild(container);

      const leafP = container.querySelector('#leaf-p') as Element;
      const nestedQuote = container.querySelector('#nested-quote') as Element;
      const notUnit = container.querySelector('#not-unit') as Element;

      expect(isLeafUnit(leafP)).toBe(true);
      expect(isLeafUnit(nestedQuote)).toBe(false); // contains p, so not leaf
      expect(isLeafUnit(notUnit)).toBe(false);
    });

    it('closestLeafUnit returns leaf unit within scope or null', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <p id="p1"><span>Inline text</span></p>
        <table><tr><td id="cell">Table cell</td></tr></table>
      `;
      document.body.appendChild(container);

      const span = container.querySelector('span') as Element;
      const cell = container.querySelector('#cell') as Element;
      const p1 = container.querySelector('#p1') as Element;

      expect(closestLeafUnit(span, container)).toBe(p1);
      expect(closestLeafUnit(cell, container)).toBeNull(); // td is not in UNIT_SELECTOR
    });

    it('listLeafUnits returns all leaf units in document order', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <h1>Title</h1>
        <p>First</p>
        <blockquote><p>Inside quote</p></blockquote>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      `;
      document.body.appendChild(container);

      const units = listLeafUnits(container);
      expect(units.length).toBe(5); // h1, p, inside quote p, li, li
      expect(units[0]?.tagName).toBe('H1');
      expect(units[1]?.textContent).toBe('First');
      expect(units[2]?.textContent).toBe('Inside quote');
      expect(units[3]?.textContent).toBe('Item 1');
      expect(units[4]?.textContent).toBe('Item 2');
    });
  });
});
