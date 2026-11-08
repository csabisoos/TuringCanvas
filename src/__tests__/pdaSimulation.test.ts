import { describe, it, expect } from 'vitest';
import { PDA } from '../core/PDA';
import type { State } from '../types/automata';

describe('PDA Simulation (Task 3.2)', () => {
  it('simulates L = { a^n b^n | n >= 0 } with final state acceptance', () => {
    const states: State[] = [
      { id: 'q0', name: 'q0', isInitial: true, isAccepting: false },
      { id: 'q1', name: 'q1', isInitial: false, isAccepting: false },
      { id: 'q2', name: 'q2', isInitial: false, isAccepting: false },
      { id: 'qAcc', name: 'qAcc', isInitial: false, isAccepting: true },
    ];
    const inputAlphabet = new Set(['a', 'b']);
    const stackAlphabet = new Set(['Z', 'A']);

    const pda = new PDA(states, inputAlphabet, stackAlphabet, 'Z', 'finalState');

    // q0: accept lambda or read first 'a'
    pda.addTransition('q0', 'qAcc', '', 'Z', ['Z']);
    pda.addTransition('q0', 'q1', 'a', 'Z', ['A', 'Z']);

    // q1: continue reading 'a's or read first 'b'
    pda.addTransition('q1', 'q1', 'a', 'A', ['A', 'A']);
    pda.addTransition('q1', 'q2', 'b', 'A', []);

    // q2: continue reading 'b's and accept when stack is back to Z
    pda.addTransition('q2', 'q2', 'b', 'A', []);
    pda.addTransition('q2', 'qAcc', '', 'Z', ['Z']);

    // Test cases
    expect(pda.simulate('')).toBe(true);
    expect(pda.simulate('ab')).toBe(true);
    expect(pda.simulate('aabb')).toBe(true);
    expect(pda.simulate('aaabbb')).toBe(true);

    expect(pda.simulate('a')).toBe(false);
    expect(pda.simulate('b')).toBe(false);
    expect(pda.simulate('aab')).toBe(false);
    expect(pda.simulate('abb')).toBe(false);
    expect(pda.simulate('ba')).toBe(false);
  });

  it('simulates acceptance by empty stack', () => {
    const states: State[] = [
      { id: 'q0', name: 'q0', isInitial: true, isAccepting: false },
      { id: 'q1', name: 'q1', isInitial: false, isAccepting: false },
    ];
    const inputAlphabet = new Set(['a', 'b']);
    const stackAlphabet = new Set(['Z', 'A']);

    const pda = new PDA(states, inputAlphabet, stackAlphabet, 'Z', 'emptyStack');

    pda.addTransition('q0', 'q0', 'a', 'Z', ['A', 'Z']);
    pda.addTransition('q0', 'q0', 'a', 'A', ['A', 'A']);
    pda.addTransition('q0', 'q1', 'b', 'A', []);
    pda.addTransition('q1', 'q1', 'b', 'A', []);
    pda.addTransition('q1', 'q1', '', 'Z', []); // pop initial Z to empty stack

    expect(pda.simulate('ab')).toBe(true);
    expect(pda.simulate('aabb')).toBe(true);
    expect(pda.simulate('a')).toBe(false);
    expect(pda.simulate('abb')).toBe(false);
  });

  it('generates stepwise configurations and stack contents', () => {
    const states: State[] = [
      { id: 'q0', name: 'q0', isInitial: true, isAccepting: false },
      { id: 'q1', name: 'q1', isInitial: false, isAccepting: true },
    ];
    const pda = new PDA(states, new Set(['a']), new Set(['Z', 'A']), 'Z', 'finalState');
    pda.addTransition('q0', 'q1', 'a', 'Z', ['A', 'Z']);

    const steps = pda.getSimulationSteps('a');
    expect(steps.length).toBeGreaterThanOrEqual(2);
    // Initial step has stack ['Z']
    expect(steps[0]?.configurations[0]?.stack).toEqual(['Z']);
    // Final step has stack ['A', 'Z'] and accepted
    const last = steps[steps.length - 1];
    expect(last.accepted).toBe(true);
    expect(last.configurations[0]?.stack).toEqual(['A', 'Z']);
  });
});
