// Visual highlighter implementation using the CSS Custom Highlight API (Spec Section 10.1)

import type { Highlighter } from '../session/ports.js';
import { HIGHLIGHT_NAME } from '../../shared/config/ui.js';

export interface HighlightRegistryPort {
  set(name: string, highlight: unknown): void;
  delete(name: string): boolean;
  clear(): void;
}

// Manages custom highlight ranges registered with the CSS Custom Highlight API
export class CssHighlighter implements Highlighter {
  private readonly registry: HighlightRegistryPort | null;

  public constructor(customRegistry?: HighlightRegistryPort | null) {
    if (customRegistry !== undefined) {
      this.registry = customRegistry;
    } else if (typeof CSS !== 'undefined' && 'highlights' in CSS) {
      this.registry = (CSS as unknown as { highlights: HighlightRegistryPort }).highlights;
    } else {
      this.registry = null;
    }
  }

  // Registers ranges with CSS.highlights under HIGHLIGHT_NAME
  public show(ranges: readonly Range[]): void {
    if (!this.registry || ranges.length === 0) {
      this.clear();
      return;
    }

    if (typeof Highlight !== 'undefined') {
      const highlight = new Highlight(...ranges);
      this.registry.set(HIGHLIGHT_NAME, highlight);
    }
  }

  // Removes HIGHLIGHT_NAME from the CSS.highlights registry
  public clear(): void {
    if (this.registry) {
      this.registry.delete(HIGHLIGHT_NAME);
    }
  }
}
