import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('merges class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('handles conditional classes', () => {
      const condition1 = true;
      const condition2 = false;
      expect(
        cn('base', condition1 && 'conditional', condition2 && 'not-included')
      ).toBe('base conditional');
    });

    it('handles undefined and null values', () => {
      expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2');
    });

    it('handles empty string', () => {
      expect(cn('class1', '', 'class2')).toBe('class1 class2');
    });

    it('deduplicates classes', () => {
      expect(cn('class1 class2', 'class1 class3')).toBe('class2 class1 class3');
    });

    it('handles Tailwind CSS conflicts', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });

    it('returns empty string for no arguments', () => {
      expect(cn()).toBe('');
    });
  });
});
