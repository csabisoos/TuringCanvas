import { describe, it, expect } from 'vitest';
import { MultiTapeTM, parseMultiTapeTransitionLabel, formatMultiTapeTransition } from '../core/MultiTapeTM';
import type { State } from '../types/automata';

describe('MultiTapeTM (Task 4.3)', () => {
  it('parses and formats multi-tape transition labels', () => {
    // 2-tape transition: "0, □; 0, 0, R, R"
    const parsed = parseMultiTapeTransitionLabel('0, □; 0, 0, R, R', 2);
    expect(parsed).toEqual({
      read: ['0', '□'],
      write: ['0', '0'],
      dirs: ['R', 'R'],
    });

    const formatted = formatMultiTapeTransition(['0', '□'], ['0', '0'], ['R', 'R']);
    expect(formatted).toBe('0, □; 0, 0, R, R');
  });

  it('simulates 2-tape palindrome recognizer', () => {
    const states: State[] = [
      { id: 'q0', name: 'q0', isInitial: true, isAccepting: false }, // Copy tape 1 to tape 2
      { id: 'qRewind', name: 'qRewind', isInitial: false, isAccepting: false }, // Rewind tape 1
      { id: 'qCompare', name: 'qCompare', isInitial: false, isAccepting: false }, // Compare tape 1 (left to right) with tape 2 (right to left)
      { id: 'qAccept', name: 'qAccept', isInitial: false, isAccepting: true },
    ];
    const inputAlphabet = new Set(['0', '1']);
    const tapeAlphabet = new Set(['0', '1', '□']);

    const mtm = new MultiTapeTM(states, inputAlphabet, tapeAlphabet, 2, '□');

    // q0: Copy tape 1 into tape 2
    mtm.addTransition('q0', 'q0', ['0', '□'], ['0', '0'], ['R', 'R']);
    mtm.addTransition('q0', 'q0', ['1', '□'], ['1', '1'], ['R', 'R']);
    mtm.addTransition('q0', 'qRewind', ['□', '□'], ['□', '□'], ['L', 'L']);

    // qRewind: Move tape 1 back to the beginning, leave tape 2 at the last character
    mtm.addTransition('qRewind', 'qRewind', ['0', '0'], ['0', '0'], ['L', 'S']);
    mtm.addTransition('qRewind', 'qRewind', ['0', '1'], ['0', '1'], ['L', 'S']);
    mtm.addTransition('qRewind', 'qRewind', ['1', '0'], ['1', '0'], ['L', 'S']);
    mtm.addTransition('qRewind', 'qRewind', ['1', '1'], ['1', '1'], ['L', 'S']);
    mtm.addTransition('qRewind', 'qCompare', ['□', '0'], ['□', '0'], ['R', 'S']);
    mtm.addTransition('qRewind', 'qCompare', ['□', '1'], ['□', '1'], ['R', 'S']);
    // Empty string case
    mtm.addTransition('qRewind', 'qAccept', ['□', '□'], ['□', '□'], ['S', 'S']);

    // qCompare: Move tape 1 right, tape 2 left, comparing characters
    mtm.addTransition('qCompare', 'qCompare', ['0', '0'], ['0', '0'], ['R', 'L']);
    mtm.addTransition('qCompare', 'qCompare', ['1', '1'], ['1', '1'], ['R', 'L']);
    // End reached on both tapes
    mtm.addTransition('qCompare', 'qAccept', ['□', '□'], ['□', '□'], ['S', 'S']);

    expect(mtm.simulate('1001').accepted).toBe(true);
    expect(mtm.simulate('101').accepted).toBe(true);
    expect(mtm.simulate('1').accepted).toBe(true);
    expect(mtm.simulate('').accepted).toBe(true);

    expect(mtm.simulate('10').accepted).toBe(false);
    expect(mtm.simulate('1000').accepted).toBe(false);
  });
});
