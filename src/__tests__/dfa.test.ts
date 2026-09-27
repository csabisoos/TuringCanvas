/**
 * Unit tests for the DFA class.
 * Covers: initialization, addTransition (valid + invalid),
 * and simulate() — string acceptance / rejection / invalid input.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DFA } from '../core/DFA';
import type { State } from '../types/automata';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const q0: State = { id: 'q0', name: 'Start', isInitial: true, isAccepting: false };
const q1: State = { id: 'q1', name: 'Middle', isInitial: false, isAccepting: false };
const q2: State = { id: 'q2', name: 'Accept', isInitial: false, isAccepting: true };

const binaryAlphabet = new Set(['0', '1']);

// ---------------------------------------------------------------------------
// 1. Initialization
// ---------------------------------------------------------------------------

describe('DFA — initialization', () => {
  it('stores the supplied states in the internal DFAData map', () => {
    const dfa = new DFA([q0, q1, q2], binaryAlphabet);
    expect(dfa.data.states.size).toBe(3);
    expect(dfa.data.states.get('q0')).toEqual(q0);
    expect(dfa.data.states.get('q2')).toEqual(q2);
  });

  it('stores the supplied alphabet verbatim', () => {
    const dfa = new DFA([q0, q1], binaryAlphabet);
    expect(dfa.data.alphabet).toEqual(binaryAlphabet);
  });

  it('starts with an empty transition list', () => {
    const dfa = new DFA([q0], new Set(['a']));
    expect(dfa.data.transitions).toHaveLength(0);
  });

  it('throws when no states are provided', () => {
    expect(() => new DFA([], binaryAlphabet)).toThrow();
  });

  it('throws when the alphabet is empty', () => {
    expect(() => new DFA([q0], new Set())).toThrow();
  });

  it('throws when more than one initial state is provided', () => {
    const secondInitial: State = { id: 'q1', name: 'Also start', isInitial: true, isAccepting: false };
    expect(() => new DFA([q0, secondInitial], binaryAlphabet)).toThrow();
  });

  it('throws when duplicate state ids are provided', () => {
    const duplicate: State = { id: 'q0', name: 'Duplicate', isInitial: false, isAccepting: false };
    expect(() => new DFA([q0, duplicate], binaryAlphabet)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// 2. addTransition — valid cases
// ---------------------------------------------------------------------------

describe('DFA — addTransition (valid)', () => {
  let dfa: DFA;

  beforeEach(() => {
    dfa = new DFA([q0, q1, q2], binaryAlphabet);
  });

  it('adds a valid transition to the transitions list', () => {
    dfa.addTransition('q0', 'q1', '0');
    expect(dfa.data.transitions).toHaveLength(1);
    expect(dfa.data.transitions[0]).toEqual({
      fromStateId: 'q0',
      toStateId: 'q1',
      symbol: '0',
    });
  });

  it('can add multiple transitions', () => {
    dfa.addTransition('q0', 'q1', '0');
    dfa.addTransition('q0', 'q2', '1');
    dfa.addTransition('q1', 'q2', '0');
    expect(dfa.data.transitions).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// 3. addTransition — invalid cases (explicit errors required)
// ---------------------------------------------------------------------------

describe('DFA — addTransition (invalid)', () => {
  let dfa: DFA;

  beforeEach(() => {
    dfa = new DFA([q0, q1, q2], binaryAlphabet);
  });

  it('throws when the symbol is not in the alphabet', () => {
    expect(() => { dfa.addTransition('q0', 'q1', 'x'); }).toThrow(
      /symbol .* not in alphabet/i,
    );
  });

  it('throws when the fromState does not exist', () => {
    expect(() => { dfa.addTransition('q99', 'q1', '0'); }).toThrow(
      /state .* does not exist/i,
    );
  });

  it('throws when the toState does not exist', () => {
    expect(() => { dfa.addTransition('q0', 'q99', '0'); }).toThrow(
      /state .* does not exist/i,
    );
  });

  it('throws when a duplicate transition (same fromState + symbol) already exists', () => {
    dfa.addTransition('q0', 'q1', '0');
    // In a DFA, δ must be a function — no two transitions share (from, symbol).
    expect(() => { dfa.addTransition('q0', 'q2', '0'); }).toThrow(
      /transition .* already defined/i,
    );
  });
});

// ---------------------------------------------------------------------------
// 4. simulate() — DFA for binary strings ending in "01"
//
// Minimal 3-state DFA over {0, 1}:
//   q0 (start)        —0→ q1,  —1→ q0
//   q1 (saw "0")      —0→ q1,  —1→ q2
//   q2 (accept,"01")  —0→ q1,  —1→ q0
//
// L = { w ∈ {0,1}* | w ends with "01" }
// ---------------------------------------------------------------------------

/** Returns a fully-wired DFA that accepts exactly the strings ending in "01". */
function buildEndsIn01DFA(): DFA {
  const start: State   = { id: 'q0', name: 'Start',    isInitial: true,  isAccepting: false };
  const saw0: State    = { id: 'q1', name: 'Saw 0',    isInitial: false, isAccepting: false };
  const accept: State  = { id: 'q2', name: 'Ends "01"',isInitial: false, isAccepting: true  };

  const dfa = new DFA([start, saw0, accept], new Set(['0', '1']));

  // q0 transitions
  dfa.addTransition('q0', 'q1', '0');
  dfa.addTransition('q0', 'q0', '1');
  // q1 transitions
  dfa.addTransition('q1', 'q1', '0');
  dfa.addTransition('q1', 'q2', '1');
  // q2 transitions
  dfa.addTransition('q2', 'q1', '0');
  dfa.addTransition('q2', 'q0', '1');

  return dfa;
}

describe('DFA — simulate() accepted strings (ends in "01")', () => {
  let dfa: DFA;

  beforeEach(() => {
    dfa = buildEndsIn01DFA();
  });

  it('accepts "01"', () => {
    expect(dfa.simulate('01')).toBe(true);
  });

  it('accepts "101"', () => {
    expect(dfa.simulate('101')).toBe(true);
  });

  it('accepts "0001"', () => {
    expect(dfa.simulate('0001')).toBe(true);
  });

  it('accepts "1001"', () => {
    expect(dfa.simulate('1001')).toBe(true);
  });

  it('accepts the empty-prefix edge-case "001"', () => {
    expect(dfa.simulate('001')).toBe(true);
  });
});

describe('DFA — simulate() rejected strings (does not end in "01")', () => {
  let dfa: DFA;

  beforeEach(() => {
    dfa = buildEndsIn01DFA();
  });

  it('rejects "0"', () => {
    expect(dfa.simulate('0')).toBe(false);
  });

  it('rejects "1"', () => {
    expect(dfa.simulate('1')).toBe(false);
  });

  it('rejects "010"', () => {
    expect(dfa.simulate('010')).toBe(false);
  });

  it('rejects "011"', () => {
    expect(dfa.simulate('011')).toBe(false);
  });

  it('rejects the empty string ""', () => {
    expect(dfa.simulate('')).toBe(false);
  });
});

describe('DFA — simulate() invalid input', () => {
  let dfa: DFA;

  beforeEach(() => {
    dfa = buildEndsIn01DFA();
  });

  it('throws when a character is not in the alphabet', () => {
    expect(() => dfa.simulate('01a')).toThrow(/not in alphabet/i);
  });

  it('throws when the input contains a multi-byte character outside the alphabet', () => {
    expect(() => dfa.simulate('0🚀1')).toThrow(/not in alphabet/i);
  });
});

describe('DFA — simulate() missing transition (incomplete DFA)', () => {
  it('throws when the DFA has no transition for the current (state, symbol) pair', () => {
    // Build a deliberately incomplete DFA — q0 has no "1" transition.
    const s0: State = { id: 'q0', name: 'Start', isInitial: true,  isAccepting: false };
    const s1: State = { id: 'q1', name: 'End',   isInitial: false, isAccepting: true  };
    const incomplete = new DFA([s0, s1], new Set(['0', '1']));
    incomplete.addTransition('q0', 'q1', '0');
    // No transition from q0 on '1' — simulate must throw.
    expect(() => incomplete.simulate('1')).toThrow(/no transition/i);
  });
});

