import { describe, it, expect } from 'vitest';
import { parseRegex } from '../core/regex/RegexParser';

describe('RegexParser (Task 2.4)', () => {
  it('parses single literal character', () => {
    const ast = parseRegex('a');
    expect(ast).toEqual({ type: 'literal', value: 'a' });
  });

  it('parses epsilon (ε and λ)', () => {
    expect(parseRegex('ε')).toEqual({ type: 'epsilon' });
    expect(parseRegex('λ')).toEqual({ type: 'epsilon' });
  });

  it('parses empty set ∅', () => {
    expect(parseRegex('∅')).toEqual({ type: 'empty_set' });
  });

  it('parses concatenation of literals', () => {
    const ast = parseRegex('ab');
    expect(ast).toEqual({
      type: 'concat',
      left: { type: 'literal', value: 'a' },
      right: { type: 'literal', value: 'b' },
    });
  });

  it('parses union (+ and |)', () => {
    expect(parseRegex('a+b')).toEqual({
      type: 'union',
      left: { type: 'literal', value: 'a' },
      right: { type: 'literal', value: 'b' },
    });
    expect(parseRegex('a|b')).toEqual({
      type: 'union',
      left: { type: 'literal', value: 'a' },
      right: { type: 'literal', value: 'b' },
    });
  });

  it('parses Kleene star (*)', () => {
    const ast = parseRegex('a*');
    expect(ast).toEqual({
      type: 'star',
      child: { type: 'literal', value: 'a' },
    });
  });

  it('handles operator precedence correctly: * > concat > +', () => {
    // a + b c* should be a + (b . (c*))
    const ast = parseRegex('a+bc*');
    expect(ast).toEqual({
      type: 'union',
      left: { type: 'literal', value: 'a' },
      right: {
        type: 'concat',
        left: { type: 'literal', value: 'b' },
        right: {
          type: 'star',
          child: { type: 'literal', value: 'c' },
        },
      },
    });
  });

  it('handles parentheses overriding precedence', () => {
    // (a+b)*
    const ast = parseRegex('(a+b)*');
    expect(ast).toEqual({
      type: 'star',
      child: {
        type: 'union',
        left: { type: 'literal', value: 'a' },
        right: { type: 'literal', value: 'b' },
      },
    });
  });

  it('throws on mismatched parentheses', () => {
    expect(() => parseRegex('(a+b')).toThrow();
    expect(() => parseRegex('a+b)')).toThrow();
  });

  it('throws on empty expression or dangling operators', () => {
    expect(() => parseRegex('')).toThrow();
    expect(() => parseRegex('a+')).toThrow();
    expect(() => parseRegex('*a')).toThrow();
  });
});
