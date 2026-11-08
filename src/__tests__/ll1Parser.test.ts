import { describe, it, expect } from 'vitest';
import { Grammar } from '../core/grammar/Grammar';
import {
  computeFirstSets,
  computeFollowSets,
  buildLL1Table,
  simulateLL1,
} from '../core/grammar/LL1Parser';

describe('LL(1) Parser Engine', () => {
  it('computes FIRST and FOLLOW sets for arithmetic grammar', () => {
    // E -> T E'
    // E' -> + T E' | ε
    // T -> F T'
    // T' -> * F T' | ε
    // F -> ( E ) | id
    const text = `
      E -> T E_
      E_ -> + T E_ | ε
      T -> F T_
      T_ -> * F T_ | ε
      F -> ( E ) | id
    `;
    const g = Grammar.fromString(text, 'E');
    const first = computeFirstSets(g.getData());
    const follow = computeFollowSets(g.getData(), first);

    expect(first.get('F')?.has('id')).toBe(true);
    expect(first.get('F')?.has('(')).toBe(true);
    expect(first.get('E')?.has('id')).toBe(true);
    expect(first.get('E_')?.has('+')).toBe(true);
    expect(first.get('E_')?.has('ε')).toBe(true);

    expect(follow.get('E')?.has('$')).toBe(true);
    expect(follow.get('E')?.has(')')).toBe(true);
  });

  it('constructs LL(1) table without conflicts for simple grammar', () => {
    const text = `
      S -> a S b | c
    `;
    const g = Grammar.fromString(text, 'S');
    const ll1 = buildLL1Table(g.getData());

    expect(ll1.hasConflicts).toBe(false);
    expect(ll1.table.get('S')?.get('a')?.length).toBe(1);
    expect(ll1.table.get('S')?.get('c')?.length).toBe(1);
  });

  it('detects conflicts in non-LL(1) grammar', () => {
    // Left-recursive: E -> E + T | T
    const text = `
      E -> E + T | T
      T -> a
    `;
    const g = Grammar.fromString(text, 'E');
    const ll1 = buildLL1Table(g.getData());
    expect(ll1.hasConflicts).toBe(true);
  });

  it('simulates step-by-step LL(1) parsing', () => {
    const text = `
      S -> a A
      A -> b | c
    `;
    const g = Grammar.fromString(text, 'S');
    const ll1 = buildLL1Table(g.getData());
    const sim = simulateLL1(ll1.table, g.getData(), 'ab');

    expect(sim.accepted).toBe(true);
    expect(sim.steps.length).toBeGreaterThan(0);
  });
});
