import { describe, it, expect } from 'vitest';
import { DFA } from '../core/DFA';
import { checkEquivalence } from '../core/automataEquivalence';
import type { State } from '../types/automata';

describe('automataEquivalence (Task 2.5)', () => {
  it('identifies identical DFAs as equivalent', () => {
    const states: State[] = [
      { id: 'q0', name: 'q0', isInitial: true, isAccepting: false },
      { id: 'q1', name: 'q1', isInitial: false, isAccepting: true },
    ];
    const alphabet = new Set(['0', '1']);
    const dfa1 = new DFA(states, alphabet);
    dfa1.addTransition('q0', 'q1', '1');
    dfa1.addTransition('q0', 'q0', '0');
    dfa1.addTransition('q1', 'q1', '0');
    dfa1.addTransition('q1', 'q0', '1');

    const result = checkEquivalence(dfa1.data, dfa1.data);
    expect(result.areEquivalent).toBe(true);
    expect(result.counterexample).toBeNull();
  });

  it('identifies equivalent DFAs with different state count (minimized vs unminimized)', () => {
    // DFA 1: 2 states (parity of 1s: odd accept)
    const states1: State[] = [
      { id: 'q0', name: 'q0', isInitial: true, isAccepting: false },
      { id: 'q1', name: 'q1', isInitial: false, isAccepting: true },
    ];
    const alphabet = new Set(['0', '1']);
    const dfa1 = new DFA(states1, alphabet);
    dfa1.addTransition('q0', 'q0', '0');
    dfa1.addTransition('q0', 'q1', '1');
    dfa1.addTransition('q1', 'q1', '0');
    dfa1.addTransition('q1', 'q0', '1');

    // DFA 2: 3 states with redundant copy of q1
    const states2: State[] = [
      { id: 'p0', name: 'p0', isInitial: true, isAccepting: false },
      { id: 'p1', name: 'p1', isInitial: false, isAccepting: true },
      { id: 'p2', name: 'p2', isInitial: false, isAccepting: true },
    ];
    const dfa2 = new DFA(states2, alphabet);
    dfa2.addTransition('p0', 'p0', '0');
    dfa2.addTransition('p0', 'p1', '1');
    dfa2.addTransition('p1', 'p2', '0');
    dfa2.addTransition('p2', 'p1', '0');
    dfa2.addTransition('p1', 'p0', '1');
    dfa2.addTransition('p2', 'p0', '1');

    const result = checkEquivalence(dfa1.data, dfa2.data);
    expect(result.areEquivalent).toBe(true);
    expect(result.counterexample).toBeNull();
  });

  it('detects non-equivalent DFAs and produces the shortest counterexample', () => {
    // DFA 1 accepts strings ending with '1'
    const states1: State[] = [
      { id: 'q0', name: 'q0', isInitial: true, isAccepting: false },
      { id: 'q1', name: 'q1', isInitial: false, isAccepting: true },
    ];
    const alphabet = new Set(['0', '1']);
    const dfa1 = new DFA(states1, alphabet);
    dfa1.addTransition('q0', 'q0', '0');
    dfa1.addTransition('q0', 'q1', '1');
    dfa1.addTransition('q1', 'q0', '0');
    dfa1.addTransition('q1', 'q1', '1');

    // DFA 2 accepts all strings with at least one '1'
    const states2: State[] = [
      { id: 'p0', name: 'p0', isInitial: true, isAccepting: false },
      { id: 'p1', name: 'p1', isInitial: false, isAccepting: true },
    ];
    const dfa2 = new DFA(states2, alphabet);
    dfa2.addTransition('p0', 'p0', '0');
    dfa2.addTransition('p0', 'p1', '1');
    dfa2.addTransition('p1', 'p1', '0');
    dfa2.addTransition('p1', 'p1', '1');

    const result = checkEquivalence(dfa1.data, dfa2.data);
    expect(result.areEquivalent).toBe(false);
    // Shortest string where they differ: "10" is accepted by DFA2 but rejected by DFA1
    expect(result.counterexample).toBe('10');
    expect(dfa1.simulate('10')).not.toBe(dfa2.simulate('10'));
  });

  it('detects difference when one accepts empty string and the other rejects it', () => {
    const states1: State[] = [
      { id: 'q0', name: 'q0', isInitial: true, isAccepting: true },
    ];
    const states2: State[] = [
      { id: 'p0', name: 'p0', isInitial: true, isAccepting: false },
    ];
    const alphabet = new Set(['a']);
    const dfa1 = new DFA(states1, alphabet);
    dfa1.addTransition('q0', 'q0', 'a');
    const dfa2 = new DFA(states2, alphabet);
    dfa2.addTransition('p0', 'p0', 'a');

    const result = checkEquivalence(dfa1.data, dfa2.data);
    expect(result.areEquivalent).toBe(false);
    expect(result.counterexample).toBe('');
  });
});
