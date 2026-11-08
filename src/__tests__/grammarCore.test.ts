import { describe, it, expect } from 'vitest';
import { Grammar } from '../core/grammar/Grammar';

describe('Grammar Core Model & Parser', () => {
  it('should parse a simple context-free grammar string', () => {
    const text = `
      S -> a S b | ε
    `;
    const g = Grammar.fromString(text, 'S');
    const data = g.getData();

    expect(data.variables.has('S')).toBe(true);
    expect(data.terminals.has('a')).toBe(true);
    expect(data.terminals.has('b')).toBe(true);
    expect(data.startVariable).toBe('S');
    expect(data.productions).toHaveLength(2);

    const p1 = data.productions[0];
    expect(p1.lhs).toBe('S');
    expect(p1.rhs).toEqual(['a', 'S', 'b']);

    const p2 = data.productions[1];
    expect(p2.lhs).toBe('S');
    expect(p2.rhs).toEqual(['ε']);
  });

  it('classifies Chomsky Type 3 (Regular right-linear grammar)', () => {
    const text = `
      S -> a A | b S | ε
      A -> a S | b
    `;
    const g = Grammar.fromString(text, 'S');
    expect(g.classifyChomsky()).toBe(3);
  });

  it('classifies Chomsky Type 2 (Context-Free grammar)', () => {
    const text = `
      S -> a S b | c
    `;
    const g = Grammar.fromString(text, 'S');
    expect(g.classifyChomsky()).toBe(2);
  });

  it('formats grammar back to string cleanly', () => {
    const text = `S -> a S b | ε`;
    const g = Grammar.fromString(text, 'S');
    const formatted = g.toString();
    expect(formatted).toContain('S -> a S b | ε');
  });
});
