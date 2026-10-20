// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { computeRanges } from '../../src/content/dom/ranges.js';

describe('Range Computation (Spec Section 8.6)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns a single range covering container when excluded is empty', () => {
    const container = document.createElement('div');
    const p1 = document.createElement('p');
    p1.textContent = 'Hello';
    const p2 = document.createElement('p');
    p2.textContent = 'World';
    container.append(p1, p2);
    document.body.appendChild(container);

    const ranges = computeRanges(container, []);
    expect(ranges.length).toBe(1);

    const range = ranges[0];
    expect(range).toBeDefined();
    expect(range?.startContainer).toBe(container);
    expect(range?.startOffset).toBe(0);
    expect(range?.endContainer).toBe(container);
    expect(range?.endOffset).toBe(container.childNodes.length);
  });

  it('splits into minimal contiguous ranges when an element in the middle is excluded', () => {
    const container = document.createElement('div');
    const p1 = document.createElement('p');
    p1.textContent = 'Keep 1';
    const p2 = document.createElement('p');
    p2.textContent = 'Exclude me';
    const p3 = document.createElement('p');
    p3.textContent = 'Keep 2';
    container.append(p1, p2, p3);
    document.body.appendChild(container);

    const ranges = computeRanges(container, [p2]);
    expect(ranges.length).toBe(2);

    const r1 = ranges[0];
    const r2 = ranges[1];
    expect(r1).toBeDefined();
    expect(r2).toBeDefined();

    expect(r1?.startContainer).toBe(p1.firstChild);
    expect(r1?.endContainer).toBe(p1.firstChild);
    expect(r1?.startOffset).toBe(0);
    expect(r1?.endOffset).toBe('Keep 1'.length);

    expect(r2?.startContainer).toBe(p3.firstChild);
    expect(r2?.endContainer).toBe(p3.firstChild);
    expect(r2?.startOffset).toBe(0);
    expect(r2?.endOffset).toBe('Keep 2'.length);
  });

  it('returns empty ranges array when all text in container is excluded', () => {
    const container = document.createElement('div');
    const p1 = document.createElement('p');
    p1.textContent = 'Exclude all';
    container.appendChild(p1);
    document.body.appendChild(container);

    const ranges = computeRanges(container, [p1]);
    expect(ranges).toEqual([]);
  });

  it('returns a single range when first element is excluded', () => {
    const container = document.createElement('div');
    const p1 = document.createElement('p');
    p1.textContent = 'Exclude';
    const p2 = document.createElement('p');
    p2.textContent = 'Keep';
    container.append(p1, p2);
    document.body.appendChild(container);

    const ranges = computeRanges(container, [p1]);
    expect(ranges.length).toBe(1);
    expect(ranges[0]?.startContainer).toBe(p2.firstChild);
  });

  it('leaves live DOM completely untouched', () => {
    const container = document.createElement('div');
    const p1 = document.createElement('p');
    p1.textContent = 'Text';
    container.appendChild(p1);
    document.body.appendChild(container);

    computeRanges(container, []);
    expect(container.childNodes.length).toBe(1);
    expect(p1.textContent).toBe('Text');
  });
});
