import { describe, it, expect } from 'vitest';
import { splitPlaceholders, mergeOverrides } from '../../scripts/translate-locales.mjs';

describe('Translation Pipeline Utilities (Spec Section 11.3 & Phase 7 Task 2)', () => {
  describe('splitPlaceholders()', () => {
    it('1. returns full string as single text part when no placeholders are present', () => {
      const parts = splitPlaceholders('Hello world');
      expect(parts).toEqual([{ type: 'text', value: 'Hello world' }]);
    });

    it('2. isolates single placeholder with prefix and suffix text', () => {
      const parts = splitPlaceholders('Enabled on $HOST$ now');
      expect(parts).toEqual([
        { type: 'text', value: 'Enabled on ' },
        { type: 'placeholder', value: '$HOST$' },
        { type: 'text', value: ' now' },
      ]);
    });

    it('3. isolates placeholder when at beginning of string', () => {
      const parts = splitPlaceholders('$HOST$ is active');
      expect(parts).toEqual([
        { type: 'placeholder', value: '$HOST$' },
        { type: 'text', value: ' is active' },
      ]);
    });

    it('4. isolates multiple consecutive and separated placeholders', () => {
      const parts = splitPlaceholders('Copy $COUNT$ items from $HOST$');
      expect(parts).toEqual([
        { type: 'text', value: 'Copy ' },
        { type: 'placeholder', value: '$COUNT$' },
        { type: 'text', value: ' items from ' },
        { type: 'placeholder', value: '$HOST$' },
      ]);
    });
  });

  describe('mergeOverrides()', () => {
    it('1. merges human overrides cleanly over generated translations', () => {
      const generated = {
        popupHeading: { message: 'Blocopy sur ce site', description: 'Heading' },
        popupHint: { message: 'Alt + double clic', description: 'Hint' },
      };
      const overrides = {
        popupHint: { message: 'Alt + double-clic sélectionne un mot.', description: 'Hint' },
      };

      const result = mergeOverrides(generated, overrides);
      expect(result).toEqual({
        popupHeading: { message: 'Blocopy sur ce site', description: 'Heading' },
        popupHint: { message: 'Alt + double-clic sélectionne un mot.', description: 'Hint' },
      });
    });

    it('2. returns generated map untouched when overrides are empty', () => {
      const generated = {
        toastCopied: { message: 'Copié', description: 'Toast' },
      };
      const result = mergeOverrides(generated, {});
      expect(result).toEqual(generated);
    });
  });
});
