import { describe, it, expect } from 'vitest';
import { DFA } from '../core/DFA';
import { DFAMinimizer } from '../core/DFAMinimizer';
import type { State } from '../types/automata';

describe('DFAMinimizer (Task 2.2)', () => {
  it('minimizes an already minimal 2-state DFA without changes', () => {
    // Parity of 1s: q0 (even, non-accept), q1 (odd, accept)
    const states: State[] = [
      { id: 'q0', name: 'q0', isInitial: true, isAccepting: false },
      { id: 'q1', name: 'q1', isInitial: false, isAccepting: true },
    ];
    const alphabet = new Set(['0', '1']);
    const dfa = new DFA(states, alphabet);
    dfa.addTransition('q0', 'q0', '0');
    dfa.addTransition('q0', 'q1', '1');
    dfa.addTransition('q1', 'q1', '0');
    dfa.addTransition('q1', 'q0', '1');

    const result = DFAMinimizer.minimize(dfa.data);

    expect(result.unreachableStates).toHaveLength(0);
    expect(result.partitions).toHaveLength(2);
    expect(result.minimalDFA.data.states.size).toBe(2);

    // Verify simulation behavior is preserved
    expect(result.minimalDFA.simulate('1')).toBe(true);
    expect(result.minimalDFA.simulate('11')).toBe(false);
    expect(result.minimalDFA.simulate('010')).toBe(true);
  });

  it('eliminates unreachable states', () => {
    const states: State[] = [
      { id: 'q0', name: 'q0', isInitial: true, isAccepting: false },
      { id: 'q1', name: 'q1', isInitial: false, isAccepting: true },
      { id: 'qDead', name: 'qDead', isInitial: false, isAccepting: false },
      { id: 'qGhost', name: 'qGhost', isInitial: false, isAccepting: true },
    ];
    const alphabet = new Set(['a']);
    const dfa = new DFA(states, alphabet);
    dfa.addTransition('q0', 'q1', 'a');
    dfa.addTransition('q1', 'q1', 'a');
    dfa.addTransition('qDead', 'qGhost', 'a');
    dfa.addTransition('qGhost', 'qGhost', 'a');

    const result = DFAMinimizer.minimize(dfa.data);

    expect(result.unreachableStates.sort()).toEqual(['qDead', 'qGhost'].sort());
    expect(result.partitions).toHaveLength(2);
    expect(result.minimalDFA.data.states.size).toBe(2);
  });

  it('collapses equivalent states in a textbook 5-state DFA to 3 states', () => {
    // States: A (init), B, C, D (accept), E
    // A on 0->B, 1->C
    // B on 0->B, 1->D
    // C on 0->B, 1->D (B and C behave identically!)
    // D on 0->D, 1->D
    // E on 0->B, 1->D (E also behaves like B and C, but B, C, E are non-accepting)
    const states: State[] = [
      { id: 'A', name: 'A', isInitial: true, isAccepting: false },
      { id: 'B', name: 'B', isInitial: false, isAccepting: false },
      { id: 'C', name: 'C', isInitial: false, isAccepting: false },
      { id: 'D', name: 'D', isInitial: false, isAccepting: true },
    ];
    const alphabet = new Set(['0', '1']);
    const dfa = new DFA(states, alphabet);
    // A: 0->B, 1->C
    dfa.addTransition('A', 'B', '0');
    dfa.addTransition('A', 'C', '1');
    // B: 0->B, 1->D
    dfa.addTransition('B', 'B', '0');
    dfa.addTransition('B', 'D', '1');
    // C: 0->B, 1->D
    dfa.addTransition('C', 'B', '0');
    dfa.addTransition('C', 'D', '1');
    // D: 0->D, 1->D
    dfa.addTransition('D', 'D', '0');
    dfa.addTransition('D', 'D', '1');

    const result = DFAMinimizer.minimize(dfa.data);

    // B and C are equivalent because both transition to B on 0 and D on 1.
    // So partitions: {A}, {B, C}, {D} => 3 states!
    expect(result.partitions).toHaveLength(3);
    expect(result.minimalDFA.data.states.size).toBe(3);

    // Verify acceptance matches
    const testStrings = ['', '0', '1', '01', '11', '001', '1010'];
    for (const str of testStrings) {
      expect(result.minimalDFA.simulate(str)).toBe(dfa.simulate(str));
    }
  });

  it('computes correct distinguishable table structure', () => {
    const states: State[] = [
      { id: 'q0', name: 'q0', isInitial: true, isAccepting: false },
      { id: 'q1', name: 'q1', isInitial: false, isAccepting: true },
    ];
    const alphabet = new Set(['a']);
    const dfa = new DFA(states, alphabet);
    dfa.addTransition('q0', 'q1', 'a');
    dfa.addTransition('q1', 'q1', 'a');

    const table = DFAMinimizer.getDistinguishableTable(dfa.data);

    expect(table.get('q0')?.get('q1')).toBe(true);
    expect(table.get('q1')?.get('q0')).toBe(true);
  });
});
