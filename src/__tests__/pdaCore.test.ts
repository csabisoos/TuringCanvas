import { describe, it, expect } from 'vitest';
import { PDA } from '../core/PDA';
import type { State } from '../types/automata';

describe('PDA Core (Task 3.1)', () => {
  const states: State[] = [
    { id: 'q0', name: 'q0', isInitial: true, isAccepting: false },
    { id: 'q1', name: 'q1', isInitial: false, isAccepting: true },
  ];
  const inputAlphabet = new Set(['a', 'b']);
  const stackAlphabet = new Set(['Z', 'A']);

  it('instantiates valid PDA with initial stack symbol Z', () => {
    const pda = new PDA(states, inputAlphabet, stackAlphabet, 'Z', 'finalState');
    expect(pda.data.states.size).toBe(2);
    expect(pda.data.initialStackSymbol).toBe('Z');
    expect(pda.data.acceptanceCriteria).toBe('finalState');
  });

  it('throws when states have no initial state', () => {
    const invalidStates: State[] = [
      { id: 'q0', name: 'q0', isInitial: false, isAccepting: false },
    ];
    expect(() => new PDA(invalidStates, inputAlphabet, stackAlphabet, 'Z')).toThrow();
  });

  it('throws when initial stack symbol is not in stack alphabet', () => {
    expect(() => new PDA(states, inputAlphabet, stackAlphabet, 'X')).toThrow();
  });

  it('adds valid transition and normalizes epsilon symbols', () => {
    const pda = new PDA(states, inputAlphabet, stackAlphabet, 'Z');
    pda.addTransition('q0', 'q0', 'a', 'Z', ['A', 'Z']);
    expect(pda.data.transitions).toHaveLength(1);
    expect(pda.data.transitions[0]).toEqual({
      fromStateId: 'q0',
      toStateId: 'q0',
      inputSymbol: 'a',
      popSymbol: 'Z',
      pushSymbols: ['A', 'Z'],
    });
  });

  it('throws when transition refers to unknown state or symbol', () => {
    const pda = new PDA(states, inputAlphabet, stackAlphabet, 'Z');
    expect(() => { pda.addTransition('qUnknown', 'q0', 'a', 'Z', ['Z']); }).toThrow();
    expect(() => { pda.addTransition('q0', 'q0', 'x', 'Z', ['Z']); }).toThrow();
    expect(() => { pda.addTransition('q0', 'q0', 'a', 'X', ['Z']); }).toThrow();
    expect(() => { pda.addTransition('q0', 'q0', 'a', 'Z', ['X']); }).toThrow();
  });
});
