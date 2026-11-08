import { describe, it, expect } from 'vitest';
import { parsePDATransitionLabel, formatPDATransition } from '../core/PDA';

describe('PDA UI & Edge formatting (Task 3.3)', () => {
  it('parses standard transition strings', () => {
    expect(parsePDATransitionLabel('a, Z; AZ')).toEqual({
      input: 'a',
      pop: 'Z',
      push: 'AZ',
    });

    expect(parsePDATransitionLabel('b, A; ε')).toEqual({
      input: 'b',
      pop: 'A',
      push: 'ε',
    });

    expect(parsePDATransitionLabel('ε, Z; Z')).toEqual({
      input: 'ε',
      pop: 'Z',
      push: 'Z',
    });
  });

  it('formats components back into string', () => {
    expect(formatPDATransition('a', 'Z', 'AZ')).toBe('a, Z; AZ');
    expect(formatPDATransition('', 'A', '')).toBe('ε, A; ε');
  });
});
