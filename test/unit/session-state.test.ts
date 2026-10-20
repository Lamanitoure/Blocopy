// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { reduce, type SessionState } from '../../src/content/session/session-state.js';

describe('Session State Reducer (Spec Section 9.1 & Phase 2 Task 8)', () => {
  let doc: Document;
  let article: HTMLElement;
  let section: HTMLElement;
  let p1: HTMLElement;
  let p2: HTMLElement;
  let outsideP: HTMLElement;

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument('test');
    section = doc.createElement('section');
    article = doc.createElement('article');
    p1 = doc.createElement('p');
    p1.textContent = 'Paragraph 1';
    p2 = doc.createElement('p');
    p2.textContent = 'Paragraph 2';
    outsideP = doc.createElement('p');
    outsideP.textContent = 'Outside element';

    article.append(p1, p2);
    section.appendChild(article);
    doc.body.append(section, outsideP);
  });

  it('1. start from idle -> active, levelIndex 0, empty excluded', () => {
    const idleState: SessionState = { kind: 'idle' };
    const levels = [article, section];
    const nextState = reduce(idleState, { type: 'start', levels });

    expect(nextState.kind).toBe('active');
    if (nextState.kind === 'active') {
      expect(nextState.levels).toEqual(levels);
      expect(nextState.levelIndex).toBe(0);
      expect(nextState.excluded.size).toBe(0);
    }
  });

  it('2. start with empty levels -> ignored (returns same state)', () => {
    const idleState: SessionState = { kind: 'idle' };
    const nextState = reduce(idleState, { type: 'start', levels: [] });
    expect(nextState).toBe(idleState);
  });

  it('3. start from active state -> restarts at level 0 with empty excluded', () => {
    const activeState: SessionState = {
      kind: 'active',
      levels: [article, section],
      levelIndex: 1,
      excluded: new Set([p1]),
    };
    const nextState = reduce(activeState, { type: 'start', levels: [article] });

    expect(nextState.kind).toBe('active');
    if (nextState.kind === 'active') {
      expect(nextState.levels).toEqual([article]);
      expect(nextState.levelIndex).toBe(0);
      expect(nextState.excluded.size).toBe(0);
    }
  });

  it('4. expand when active and levelIndex < levels.length - 1 -> levelIndex + 1, excluded cleared', () => {
    const activeState: SessionState = {
      kind: 'active',
      levels: [article, section],
      levelIndex: 0,
      excluded: new Set([p1]),
    };
    const nextState = reduce(activeState, { type: 'expand' });

    expect(nextState.kind).toBe('active');
    if (nextState.kind === 'active') {
      expect(nextState.levelIndex).toBe(1);
      expect(nextState.excluded.size).toBe(0);
      expect(nextState.levels).toBe(activeState.levels);
    }
  });

  it('5. expand at the last level -> state unchanged', () => {
    const activeState: SessionState = {
      kind: 'active',
      levels: [article, section],
      levelIndex: 1,
      excluded: new Set([p1]),
    };
    const nextState = reduce(activeState, { type: 'expand' });
    expect(nextState).toBe(activeState);
  });

  it('6. back when active and levelIndex > 0 -> levelIndex - 1, excluded cleared', () => {
    const activeState: SessionState = {
      kind: 'active',
      levels: [article, section],
      levelIndex: 1,
      excluded: new Set([p1]),
    };
    const nextState = reduce(activeState, { type: 'back' });

    expect(nextState.kind).toBe('active');
    if (nextState.kind === 'active') {
      expect(nextState.levelIndex).toBe(0);
      expect(nextState.excluded.size).toBe(0);
    }
  });

  it('7. back at level 0 -> idle', () => {
    const activeState: SessionState = {
      kind: 'active',
      levels: [article, section],
      levelIndex: 0,
      excluded: new Set([p1]),
    };
    const nextState = reduce(activeState, { type: 'back' });
    expect(nextState).toEqual({ kind: 'idle' });
  });

  it('8. toggle when active -> adds unit if absent, removes if present', () => {
    const activeState: SessionState = {
      kind: 'active',
      levels: [article, section],
      levelIndex: 0,
      excluded: new Set(),
    };

    // Toggle on (exclude)
    const excludedOnce = reduce(activeState, { type: 'toggle', unit: p1 });
    expect(excludedOnce.kind).toBe('active');
    if (excludedOnce.kind === 'active') {
      expect(excludedOnce.excluded.has(p1)).toBe(true);
      expect(excludedOnce.excluded.size).toBe(1);

      // Toggle off (re-include)
      const reincluded = reduce(excludedOnce, { type: 'toggle', unit: p1 });
      expect(reincluded.kind).toBe('active');
      if (reincluded.kind === 'active') {
        expect(reincluded.excluded.has(p1)).toBe(false);
        expect(reincluded.excluded.size).toBe(0);
      }
    }
  });

  it('9. toggle unit outside current container -> ignored', () => {
    const activeState: SessionState = {
      kind: 'active',
      levels: [article, section],
      levelIndex: 0, // current container is article
      excluded: new Set(),
    };
    // outsideP is outside article
    const nextState = reduce(activeState, { type: 'toggle', unit: outsideP });
    expect(nextState).toBe(activeState);
  });

  it('10. end action -> idle', () => {
    const activeState: SessionState = {
      kind: 'active',
      levels: [article, section],
      levelIndex: 0,
      excluded: new Set([p1]),
    };
    const nextState = reduce(activeState, { type: 'end' });
    expect(nextState).toEqual({ kind: 'idle' });
  });

  it('11. any action on idle other than start -> unchanged', () => {
    const idleState: SessionState = { kind: 'idle' };
    expect(reduce(idleState, { type: 'expand' })).toBe(idleState);
    expect(reduce(idleState, { type: 'back' })).toBe(idleState);
    expect(reduce(idleState, { type: 'toggle', unit: p1 })).toBe(idleState);
    expect(reduce(idleState, { type: 'end' })).toBe(idleState);
  });

  it('12. first click of a double-click then expand leaves no exclusions', () => {
    const initialActive: SessionState = {
      kind: 'active',
      levels: [article, section],
      levelIndex: 0,
      excluded: new Set(),
    };

    // First click of a double click toggles the unit
    const afterFirstClick = reduce(initialActive, { type: 'toggle', unit: p1 });
    expect(afterFirstClick.kind).toBe('active');
    if (afterFirstClick.kind === 'active') {
      expect(afterFirstClick.excluded.has(p1)).toBe(true);

      // Following expand action clears all exclusions
      const afterExpand = reduce(afterFirstClick, { type: 'expand' });
      expect(afterExpand.kind).toBe('active');
      if (afterExpand.kind === 'active') {
        expect(afterExpand.levelIndex).toBe(1);
        expect(afterExpand.excluded.size).toBe(0);
      }
    }
  });

  it('13. reducer never mutates its input state or input sets', () => {
    const originalSet = new Set([p1]);
    const activeState: SessionState = {
      kind: 'active',
      levels: Object.freeze([article, section]),
      levelIndex: 0,
      excluded: originalSet,
    };

    reduce(activeState, { type: 'toggle', unit: p2 });
    expect(originalSet.size).toBe(1);
    expect(originalSet.has(p2)).toBe(false);

    reduce(activeState, { type: 'expand' });
    expect(activeState.levelIndex).toBe(0);
    expect(originalSet.size).toBe(1);
  });
});
