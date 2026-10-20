// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { resolveTarget } from '../../src/content/dom/target.js';

describe('Target Resolution (Spec Section 9.3 & Phase 3 Task 2)', () => {
  it('resolves directly to the element when target is an element', () => {
    const div = document.createElement('div');
    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', { value: div });
    Object.defineProperty(event, 'composedPath', { value: () => [div] });

    expect(resolveTarget(event)).toBe(div);
  });

  it('resolves a text node to its parent element', () => {
    const p = document.createElement('p');
    const textNode = document.createTextNode('Hello world');
    p.appendChild(textNode);

    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', { value: textNode });
    Object.defineProperty(event, 'composedPath', { value: () => [textNode, p] });

    expect(resolveTarget(event)).toBe(p);
  });

  it('resolves through Shadow DOM using composedPath()[0]', () => {
    const host = document.createElement('div');
    const shadowRoot = host.attachShadow({ mode: 'open' });
    const button = document.createElement('button');
    shadowRoot.appendChild(button);

    const event = new MouseEvent('click');
    // composedPath provides the innermost original element inside the shadow root
    Object.defineProperty(event, 'target', { value: host });
    Object.defineProperty(event, 'composedPath', { value: () => [button, shadowRoot, host] });

    expect(resolveTarget(event)).toBe(button);
  });

  it('returns null if target cannot be resolved or has no parent element', () => {
    const orphanText = document.createTextNode('Orphan text');
    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', { value: orphanText });
    Object.defineProperty(event, 'composedPath', { value: () => [orphanText] });

    expect(resolveTarget(event)).toBeNull();
  });
});
