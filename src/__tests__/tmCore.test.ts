import { describe, it, expect } from 'vitest';
import { TM, parseTMTransitionLabel, formatTMTransition } from '../core/TM';
import type { State } from '../types/automata';

describe('TM Core (Task 4.1)', () => {
  it('parses and formats TM transition labels', () => {
    expect(parseTMTransitionLabel('0; 1, R')).toEqual({
      read: '0',
      write: '1',
      dir: 'R',
    });
    expect(parseTMTransitionLabel('a; X, L')).toEqual({
      read: 'a',
      write: 'X',
      dir: 'L',
    });
    expect(parseTMTransitionLabel('□; □, S')).toEqual({
      read: '□',
      write: '□',
      dir: 'S',
    });
    expect(formatTMTransition('0', '1', 'R')).toBe('0; 1, R');
  });

  it('performs binary increment: w -> w + 1', () => {
    // States: q0 (scan right), q1 (add 1 with carry), qHalt (accept)
    const states: State[] = [
      { id: 'q0', name: 'q0', isInitial: true, isAccepting: false },
      { id: 'q1', name: 'q1', isInitial: false, isAccepting: false },
      { id: 'qHalt', name: 'qHalt', isInitial: false, isAccepting: true },
    ];
    const inputAlphabet = new Set(['0', '1']);
    const tapeAlphabet = new Set(['0', '1', '□']);

    const tm = new TM(states, inputAlphabet, tapeAlphabet, '□');

    // q0: scan to the right end
    tm.addTransition('q0', 'q0', '0', '0', 'R');
    tm.addTransition('q0', 'q0', '1', '1', 'R');
    tm.addTransition('q0', 'q1', '□', '□', 'L');

    // q1: add 1
    tm.addTransition('q1', 'qHalt', '0', '1', 'S');
    tm.addTransition('q1', 'q1', '1', '0', 'L');
    tm.addTransition('q1', 'qHalt', '□', '1', 'S');

    // 101 -> 110
    const res1 = tm.simulate('101');
    expect(res1.halted).toBe(true);
    expect(res1.accepted).toBe(true);
    expect(res1.finalTape).toBe('110');

    // 11 -> 100
    const res2 = tm.simulate('11');
    expect(res2.halted).toBe(true);
    expect(res2.accepted).toBe(true);
    expect(res2.finalTape).toBe('100');
  });

  it('recognizes context-sensitive language L = { a^n b^n c^n | n >= 1 }', () => {
    const states: State[] = [
      { id: 'q0', name: 'q0', isInitial: true, isAccepting: false },
      { id: 'q1', name: 'q1', isInitial: false, isAccepting: false },
      { id: 'q2', name: 'q2', isInitial: false, isAccepting: false },
      { id: 'q3', name: 'q3', isInitial: false, isAccepting: false },
      { id: 'q4', name: 'q4', isInitial: false, isAccepting: false },
      { id: 'qAccept', name: 'qAccept', isInitial: false, isAccepting: true },
    ];
    const inputAlphabet = new Set(['a', 'b', 'c']);
    const tapeAlphabet = new Set(['a', 'b', 'c', 'X', 'Y', 'Z', '□']);

    const tm = new TM(states, inputAlphabet, tapeAlphabet, '□');

    // q0: mark a -> X, go to q1
    tm.addTransition('q0', 'q1', 'a', 'X', 'R');
    // If all a's are consumed, scan Y's and Z's to accept
    tm.addTransition('q0', 'q4', 'Y', 'Y', 'R');

    // q1: skip a's and Y's, mark first b -> Y, go to q2
    tm.addTransition('q1', 'q1', 'a', 'a', 'R');
    tm.addTransition('q1', 'q1', 'Y', 'Y', 'R');
    tm.addTransition('q1', 'q2', 'b', 'Y', 'R');

    // q2: skip b's and Z's, mark first c -> Z, go to q3
    tm.addTransition('q2', 'q2', 'b', 'b', 'R');
    tm.addTransition('q2', 'q2', 'Z', 'Z', 'R');
    tm.addTransition('q2', 'q3', 'c', 'Z', 'L');

    // q3: rewind to the right of the latest X
    tm.addTransition('q3', 'q3', 'a', 'a', 'L');
    tm.addTransition('q3', 'q3', 'b', 'b', 'L');
    tm.addTransition('q3', 'q3', 'Y', 'Y', 'L');
    tm.addTransition('q3', 'q3', 'Z', 'Z', 'L');
    tm.addTransition('q3', 'q0', 'X', 'X', 'R');

    // q4: verify that only Y's, Z's and blanks remain
    tm.addTransition('q4', 'q4', 'Y', 'Y', 'R');
    tm.addTransition('q4', 'q4', 'Z', 'Z', 'R');
    tm.addTransition('q4', 'qAccept', '□', '□', 'R');

    // Test cases
    expect(tm.simulate('abc').accepted).toBe(true);
    expect(tm.simulate('aabbcc').accepted).toBe(true);
    expect(tm.simulate('ab').accepted).toBe(false);
    expect(tm.simulate('aabbc').accepted).toBe(false);
    expect(tm.simulate('aabcc').accepted).toBe(false);
  });
});
