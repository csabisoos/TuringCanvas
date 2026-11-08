import { describe, it, expect } from 'vitest';
import { parseRegex } from '../core/regex/RegexParser';
import { ThompsonCompiler } from '../core/regex/ThompsonCompiler';
import { buildAndSimulate } from '../store/simulationAdapter';

function matches(regexStr: string, input: string): boolean {
  const ast = parseRegex(regexStr);
  const { nodes, edges } = ThompsonCompiler.compile(ast);
  const result = buildAndSimulate(nodes, edges, input);
  if ('kind' in result) {
    throw new Error(`Simulation error: ${result.kind}`);
  }
  return result.accepted;
}

describe('ThompsonCompiler (Task 2.4)', () => {
  it('compiles single literal', () => {
    expect(matches('a', 'a')).toBe(true);
    expect(matches('a', '')).toBe(false);
    expect(matches('a', 'b')).toBe(false);
    expect(matches('a', 'aa')).toBe(false);
  });

  it('compiles epsilon', () => {
    expect(matches('ε', '')).toBe(true);
    expect(matches('ε', 'a')).toBe(false);
  });

  it('compiles union (a+b)', () => {
    expect(matches('a+b', 'a')).toBe(true);
    expect(matches('a+b', 'b')).toBe(true);
    expect(matches('a+b', '')).toBe(false);
    expect(matches('a+b', 'ab')).toBe(false);
  });

  it('compiles concatenation (ab)', () => {
    expect(matches('ab', 'ab')).toBe(true);
    expect(matches('ab', 'a')).toBe(false);
    expect(matches('ab', 'b')).toBe(false);
    expect(matches('ab', '')).toBe(false);
  });

  it('compiles Kleene star (a*)', () => {
    expect(matches('a*', '')).toBe(true);
    expect(matches('a*', 'a')).toBe(true);
    expect(matches('a*', 'aaaa')).toBe(true);
    expect(matches('a*', 'b')).toBe(false);
  });

  it('compiles complex nested expressions ((a+b)*c)', () => {
    expect(matches('(a+b)*c', 'c')).toBe(true);
    expect(matches('(a+b)*c', 'ac')).toBe(true);
    expect(matches('(a+b)*c', 'bc')).toBe(true);
    expect(matches('(a+b)*c', 'aababbc')).toBe(true);
    expect(matches('(a+b)*c', 'a')).toBe(false);
    expect(matches('(a+b)*c', 'ab')).toBe(false);
    expect(matches('(a+b)*c', '')).toBe(false);
  });

  it('produces valid nodes with exactly one initial and at least one accepting state', () => {
    const ast = parseRegex('(0+1)*00');
    const { nodes, edges } = ThompsonCompiler.compile(ast);

    const initials = nodes.filter((n) => n.isInitial);
    const acceptings = nodes.filter((n) => n.isAccepting);

    expect(initials).toHaveLength(1);
    expect(acceptings.length).toBeGreaterThanOrEqual(1);
    expect(edges.length).toBeGreaterThan(0);
  });
});
