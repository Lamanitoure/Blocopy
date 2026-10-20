// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { isEligible, type EligibilityContext } from '../../src/content/dom/eligibility.js';

describe('Guard Rules & Eligibility (Spec Section 2.3 & Phase 3 Task 2)', () => {
  let article: HTMLElement;
  let p1: HTMLElement;
  let p2: HTMLElement;
  const defaultContext: EligibilityContext = {
    isSiteDisabled: false,
    settingsLoaded: true,
  };

  beforeEach(() => {
    document.body.innerHTML = '';

    article = document.createElement('article');
    p1 = document.createElement('p');
    p1.textContent = 'First paragraph in article.';
    p2 = document.createElement('p');
    p2.textContent = 'Second paragraph in article.';

    article.append(p1, p2);
    document.body.appendChild(article);
  });

  function createMouseEvent(overrides: { altKey?: boolean; isTrusted?: boolean } = {}): MouseEvent {
    const isTrusted = overrides.isTrusted ?? true;
    const altKey = overrides.altKey ?? false;

    return {
      isTrusted,
      altKey,
      type: 'dblclick',
      bubbles: true,
      cancelable: true,
    } as unknown as MouseEvent;
  }

  // Guard 1: event.isTrusted is false
  it('1. returns false when event.isTrusted is false (synthetic event)', () => {
    const event = createMouseEvent({ isTrusted: false });
    expect(isEligible(event, p1, defaultContext, document.body)).toBe(false);
  });

  // Guard 2: Alt key is pressed
  it('2. returns false when the Alt key is pressed', () => {
    const event = createMouseEvent({ isTrusted: true, altKey: true });
    expect(isEligible(event, p1, defaultContext, document.body)).toBe(false);
  });

  // Guard 3a: Site is disabled by user
  it('3a. returns false when the site is disabled by the user', () => {
    const event = createMouseEvent({ isTrusted: true });
    const context: EligibilityContext = { isSiteDisabled: true, settingsLoaded: true };
    expect(isEligible(event, p1, context, document.body)).toBe(false);
  });

  // Guard 3b: Settings are not loaded yet
  it('3b. returns false when settings are not loaded yet', () => {
    const event = createMouseEvent({ isTrusted: true });
    const context: EligibilityContext = { isSiteDisabled: false, settingsLoaded: false };
    expect(isEligible(event, p1, context, document.body)).toBe(false);
  });

  // Guard 4: Target is inside INTERACTIVE_SELECTOR (e.g. button, a, input, [contenteditable])
  it('4. returns false when target is inside interactive elements', () => {
    const event = createMouseEvent({ isTrusted: true });

    // Link inside paragraph
    const link = document.createElement('a');
    link.href = 'https://example.com';
    link.textContent = 'Clickable link';
    p1.appendChild(link);
    expect(isEligible(event, link, defaultContext, document.body)).toBe(false);

    // Button
    const button = document.createElement('button');
    button.textContent = 'Submit';
    p1.appendChild(button);
    expect(isEligible(event, button, defaultContext, document.body)).toBe(false);

    // Contenteditable
    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', 'true');
    const editableP = document.createElement('p');
    editableP.textContent = 'Editable text';
    editable.appendChild(editableP);
    article.appendChild(editable);
    expect(isEligible(event, editableP, defaultContext, document.body)).toBe(false);
  });

  // Guard 5: No unit can be found at or above target
  it('5. returns false when no unit can be found at or above the target', () => {
    const event = createMouseEvent({ isTrusted: true });
    const rawDiv = document.createElement('div');
    rawDiv.textContent = 'Raw div text without paragraph or unit tag';
    document.body.appendChild(rawDiv);

    expect(isEligible(event, rawDiv, defaultContext, document.body)).toBe(false);
  });

  // Guard 6: No level can be computed (findLevels returns empty list)
  it('6. returns false when no container level can be computed', () => {
    const event = createMouseEvent({ isTrusted: true });
    // Single isolated paragraph directly in body has no valid container ancestor
    const loneP = document.createElement('p');
    loneP.textContent = 'Lone paragraph in body';
    document.body.appendChild(loneP);

    expect(isEligible(event, loneP, defaultContext, document.body)).toBe(false);
  });

  // Positive case: Eligible target with valid container
  it('7. returns true when all guard checks pass on an eligible container', () => {
    const event = createMouseEvent({ isTrusted: true });
    expect(isEligible(event, p1, defaultContext, document.body)).toBe(true);
  });
});
