import { describe, it, expect } from 'vitest';
import { Grammar } from '../core/grammar/Grammar';
import {
  buildLR0ItemSets,
  buildSLR1Table,
  simulateSLR1,
} from '../core/grammar/LRParser';

describe('SLR(1) / LR(0) Parsing Suite', () => {
  it('computes LR(0) canonical collection and item sets DFA', () => {
    // S -> a S b | c
    const text = `
      S -> a S b | c
    `;
    const g = Grammar.fromString(text, 'S');
    const { states, transitions } = buildLR0ItemSets(g.getData());

    expect(states.length).toBeGreaterThan(1);
    expect(transitions.length).toBeGreaterThan(0);
    // Initial state 0 should contain S' -> . S
    expect(states[0]?.items.some((it) => it.lhs === "S'" && it.dot === 0)).toBe(true);
  });

  it('builds SLR(1) ACTION and GOTO tables without conflicts for simple grammar', () => {
    const text = `
      S -> a S b | c
    `;
    const g = Grammar.fromString(text, 'S');
    const slr = buildSLR1Table(g.getData());

    expect(slr.hasConflicts).toBe(false);
    expect(slr.states.length).toBeGreaterThan(0);
  });

  it('simulates shift-reduce parsing and accepts valid string', () => {
    const text = `
      S -> a S b | c
    `;
    const g = Grammar.fromString(text, 'S');
    const slr = buildSLR1Table(g.getData());
    const sim = simulateSLR1(slr, g.getData(), 'acb');

    expect(sim.accepted).toBe(true);
    expect(sim.steps.length).toBeGreaterThan(0);
    expect(sim.parseTreeRoot).toBeDefined();
    expect(sim.parseTreeRoot?.label).toBe('S');
  });

  it('rejects invalid syntax with shift-reduce error', () => {
    const text = `
      S -> a S b | c
    `;
    const g = Grammar.fromString(text, 'S');
    const slr = buildSLR1Table(g.getData());
    const sim = simulateSLR1(slr, g.getData(), 'abb');

    expect(sim.accepted).toBe(false);
  });
});
