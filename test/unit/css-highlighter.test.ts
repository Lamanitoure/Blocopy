// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CssHighlighter } from '../../src/content/highlight/css-highlighter.js';
import { HIGHLIGHT_NAME } from '../../src/shared/config/ui.js';
import type { HighlightRegistryPort } from '../../src/content/highlight/css-highlighter.js';

describe('CssHighlighter (Spec Section 10.1 & Phase 5)', () => {
  let mockRegistry: HighlightRegistryPort;
  let setSpy: ReturnType<typeof vi.fn<(name: string, highlight: unknown) => void>>;
  let deleteSpy: ReturnType<typeof vi.fn<(name: string) => boolean>>;
  let clearSpy: ReturnType<typeof vi.fn<() => void>>;

  let p: HTMLParagraphElement;
  let range1: Range;
  let range2: Range;

  beforeEach(() => {
    setSpy = vi.fn();
    deleteSpy = vi.fn().mockReturnValue(true);
    clearSpy = vi.fn();

    mockRegistry = {
      set: setSpy,
      delete: deleteSpy,
      clear: clearSpy,
    };

    document.body.innerHTML = '';
    p = document.createElement('p');
    p.innerHTML = 'First line of text.<br>Second line of text.';
    document.body.appendChild(p);

    range1 = document.createRange();
    range1.setStart(p, 0);
    range1.setEnd(p, 1);

    range2 = document.createRange();
    range2.setStart(p, 1);
    range2.setEnd(p, 2);

    // Mock global Highlight if not provided by jsdom
    if (typeof globalThis.Highlight === 'undefined') {
      class MockHighlight {
        public readonly ranges: Range[];
        public constructor(...ranges: Range[]) {
          this.ranges = ranges;
        }
      }
      globalThis.Highlight = MockHighlight as unknown as typeof Highlight;
    }
  });

  // 1. show(ranges) registers Highlight with HIGHLIGHT_NAME in registry
  it('1. show(ranges) creates Highlight and stores it in registry under HIGHLIGHT_NAME', () => {
    const highlighter = new CssHighlighter(mockRegistry);
    highlighter.show([range1, range2]);

    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(setSpy).toHaveBeenCalledWith(HIGHLIGHT_NAME, expect.any(Object));

    const storedHighlight = setSpy.mock.calls[0]?.[1] as { ranges?: Range[] };
    expect(storedHighlight.ranges).toEqual([range1, range2]);
  });

  // 2. show([]) with empty ranges calls clear
  it('2. show with empty array clears the highlight', () => {
    const highlighter = new CssHighlighter(mockRegistry);
    highlighter.show([]);

    expect(deleteSpy).toHaveBeenCalledWith(HIGHLIGHT_NAME);
    expect(setSpy).not.toHaveBeenCalled();
  });

  // 3. clear() removes HIGHLIGHT_NAME from registry
  it('3. clear() removes HIGHLIGHT_NAME from registry', () => {
    const highlighter = new CssHighlighter(mockRegistry);
    highlighter.clear();

    expect(deleteSpy).toHaveBeenCalledTimes(1);
    expect(deleteSpy).toHaveBeenCalledWith(HIGHLIGHT_NAME);
  });

  // 4. Gracefully does nothing if no registry is available
  it('4. handles absence of CSS.highlights gracefully without errors', () => {
    const highlighter = new CssHighlighter(null);

    expect(() => {
      highlighter.show([range1]);
      highlighter.clear();
    }).not.toThrow();
  });
});
