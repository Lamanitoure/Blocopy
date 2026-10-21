// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DomSessionListeners } from '../../src/content/events/listeners.js';
import type { SessionAction } from '../../src/content/session/session-state.js';

describe('Session Event Listeners (Spec Section 9.3 & Phase 3 Task 3)', () => {
  let listeners: DomSessionListeners;
  let dispatchMock: ReturnType<typeof vi.fn<(action: SessionAction) => void>>;
  let article: HTMLElement;
  let p1: HTMLElement;
  let p2: HTMLElement;
  let outsideP: HTMLElement;
  let link: HTMLAnchorElement;

  beforeEach(() => {
    document.body.innerHTML = '';

    article = document.createElement('article');
    p1 = document.createElement('p');
    p1.textContent = 'First paragraph';
    p2 = document.createElement('p');
    p2.textContent = 'Second paragraph';

    link = document.createElement('a');
    link.href = 'https://example.com';
    link.textContent = 'Interactive link';
    p2.appendChild(link);

    outsideP = document.createElement('p');
    outsideP.textContent = 'Outside paragraph';

    article.append(p1, p2);
    document.body.append(article, outsideP);

    dispatchMock = vi.fn<(action: SessionAction) => void>();
    listeners = new DomSessionListeners(document);
  });

  function createClick(target: EventTarget, overrides: Partial<MouseEventInit> = {}): MouseEvent {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
      detail: 1,
      ...overrides,
    });
    Object.defineProperty(event, 'target', { value: target });
    Object.defineProperty(event, 'composedPath', { value: () => [target] });
    return event;
  }

  // 1. Plain left click on unit inside container -> prevents default, stops propagation, dispatches toggle
  it('1. toggles unit on plain left click inside container, preventing default and stopping propagation', () => {
    listeners.attach(article, dispatchMock);

    const event = createClick(p1);
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

    document.dispatchEvent(event);

    expect(dispatchMock).toHaveBeenCalledWith({ type: 'toggle', unit: p1 });
    expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
    expect(stopPropagationSpy).toHaveBeenCalledTimes(1);
  });

  // 2. Click outside container -> dispatches back like Escape without modifying native event
  it('2. steps back on click outside container without modifying native event', () => {
    listeners.attach(article, dispatchMock);

    const event = createClick(outsideP);
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

    document.dispatchEvent(event);

    expect(dispatchMock).toHaveBeenCalledWith({ type: 'back' });
    expect(preventDefaultSpy).not.toHaveBeenCalled();
    expect(stopPropagationSpy).not.toHaveBeenCalled();
  });

  // 3. Modified clicks (Ctrl/Cmd/Shift/Alt) -> ignored, native behavior preserved
  it('3. ignores modified clicks (Ctrl, Alt, Shift, Meta) preserving native link behavior', () => {
    listeners.attach(article, dispatchMock);

    const ctrlClick = createClick(link, { ctrlKey: true });
    document.dispatchEvent(ctrlClick);
    expect(dispatchMock).not.toHaveBeenCalled();

    const altClick = createClick(p1, { altKey: true });
    document.dispatchEvent(altClick);
    expect(dispatchMock).not.toHaveBeenCalled();

    const rightClick = createClick(p1, { button: 2 });
    document.dispatchEvent(rightClick);
    expect(dispatchMock).not.toHaveBeenCalled();

    const ctrlOutsideClick = createClick(outsideP, { ctrlKey: true });
    document.dispatchEvent(ctrlOutsideClick);
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  // 4. Click with detail > 1 -> ignored by click listener (handled by double-click / mousedown)
  it('4. ignores click with detail > 1 (only detail === 1 may toggle unit)', () => {
    listeners.attach(article, dispatchMock);

    const secondClick = createClick(p1, { detail: 2 });
    document.dispatchEvent(secondClick);

    expect(dispatchMock).not.toHaveBeenCalled();
  });

  // 5. mousedown with detail > 1 inside container -> prevents default to avoid word selection flicker
  it('5. prevents default on mousedown with detail > 1 inside container', () => {
    listeners.attach(article, dispatchMock);

    const mousedownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      detail: 2,
    });
    Object.defineProperty(mousedownEvent, 'target', { value: p1 });
    Object.defineProperty(mousedownEvent, 'composedPath', { value: () => [p1] });
    const preventSpy = vi.spyOn(mousedownEvent, 'preventDefault');

    document.dispatchEvent(mousedownEvent);

    expect(preventSpy).toHaveBeenCalledTimes(1);
  });

  // 6. keydown Escape -> dispatches back without preventDefault or stopPropagation
  it('6. dispatches back on Escape keydown without blocking native event', () => {
    listeners.attach(article, dispatchMock);

    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    const preventSpy = vi.spyOn(escapeEvent, 'preventDefault');
    const stopSpy = vi.spyOn(escapeEvent, 'stopPropagation');

    document.dispatchEvent(escapeEvent);

    expect(dispatchMock).toHaveBeenCalledWith({ type: 'back' });
    expect(preventSpy).not.toHaveBeenCalled();
    expect(stopSpy).not.toHaveBeenCalled();
  });

  // 7. detach -> aborts all listeners via AbortController
  it('7. detach unregisters all listeners immediately', () => {
    listeners.attach(article, dispatchMock);
    listeners.detach();

    const clickEvent = createClick(p1);
    document.dispatchEvent(clickEvent);

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escapeEvent);

    expect(dispatchMock).not.toHaveBeenCalled();
  });
});
