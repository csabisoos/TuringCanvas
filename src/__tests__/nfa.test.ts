/**
 * Unit tests for the NFA class.
 * Written BEFORE the implementation (TDD Red phase).
 *
 * Suites:
 *   1. Initialization — state map, alphabet, invariant guards
 *   2. addTransition (valid) — non-determinism, epsilon transitions
 *   3. addTransition (invalid) — symbol/state guard errors
 *   4. getEpsilonClosure — core algorithm correctness
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { NFA } from '../core/NFA';
import { EPSILON } from '../types/automata';
import type { State } from '../types/automata';

// ─────────────────────────────────────────────────────────────────────────────
// Shared state fixtures
// ─────────────────────────────────────────────────────────────────────────────

const q0: State = { id: 'q0', name: 'q0', isInitial: true,  isAccepting: false };
const q1: State = { id: 'q1', name: 'q1', isInitial: false, isAccepting: false };
const q2: State = { id: 'q2', name: 'q2', isInitial: false, isAccepting: false };
const q3: State = { id: 'q3', name: 'q3', isInitial: false, isAccepting: true  };

const ab = new Set(['a', 'b']);

// ─────────────────────────────────────────────────────────────────────────────
// 1. Initialization
// ─────────────────────────────────────────────────────────────────────────────

describe('NFA — initialization', () => {
  it('stores states in the internal NFAData map', () => {
    const nfa = new NFA([q0, q1, q2, q3], ab);
    expect(nfa.data.states.size).toBe(4);
    expect(nfa.data.states.get('q3')).toEqual(q3);
  });

  it('stores the alphabet verbatim', () => {
    const nfa = new NFA([q0, q1], ab);
    expect(nfa.data.alphabet).toEqual(ab);
  });

  it('starts with an empty transition list', () => {
    const nfa = new NFA([q0], new Set(['x']));
    expect(nfa.data.transitions).toHaveLength(0);
  });

  it('throws when no states are provided', () => {
    expect(() => new NFA([], ab)).toThrow();
  });

  it('throws when the alphabet is empty', () => {
    expect(() => new NFA([q0], new Set())).toThrow();
  });

  it('throws when more than one initial state is provided', () => {
    const q1init: State = { ...q1, isInitial: true };
    expect(() => new NFA([q0, q1init], ab)).toThrow();
  });

  it('throws when duplicate state ids are provided', () => {
    const dup: State = { ...q0, name: 'dup' };
    expect(() => new NFA([q0, dup], ab)).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. addTransition — valid cases (non-determinism is the key difference vs DFA)
// ─────────────────────────────────────────────────────────────────────────────

describe('NFA — addTransition (valid)', () => {
  let nfa: NFA;

  beforeEach(() => {
    nfa = new NFA([q0, q1, q2, q3], ab);
  });

  it('adds a regular transition', () => {
    nfa.addTransition('q0', 'q1', 'a');
    expect(nfa.data.transitions).toHaveLength(1);
    expect(nfa.data.transitions[0]).toEqual({
      fromStateId: 'q0',
      toStateId: 'q1',
      symbol: 'a',
    });
  });

  it('allows multiple transitions from the same state on the same symbol (non-determinism)', () => {
    nfa.addTransition('q0', 'q1', 'a');
    nfa.addTransition('q0', 'q2', 'a'); // same (q0, 'a') → two targets
    expect(nfa.data.transitions).toHaveLength(2);
  });

  it('adds an epsilon transition using the EPSILON constant', () => {
    nfa.addTransition('q0', 'q1', EPSILON);
    const t = nfa.data.transitions[0];
    expect(t.symbol).toBe(EPSILON);
    expect(t.fromStateId).toBe('q0');
    expect(t.toStateId).toBe('q1');
  });

  it('allows both epsilon and regular transitions from the same state', () => {
    nfa.addTransition('q0', 'q1', EPSILON);
    nfa.addTransition('q0', 'q1', 'a');
    nfa.addTransition('q0', 'q2', 'b');
    expect(nfa.data.transitions).toHaveLength(3);
  });

  it('allows self-loop epsilon transitions', () => {
    // ε-loop on q0 should be storable (the closure algorithm must handle it)
    nfa.addTransition('q0', 'q0', EPSILON);
    expect(nfa.data.transitions).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. addTransition — invalid cases
// ─────────────────────────────────────────────────────────────────────────────

describe('NFA — addTransition (invalid)', () => {
  let nfa: NFA;

  beforeEach(() => {
    nfa = new NFA([q0, q1, q2, q3], ab);
  });

  it('throws when the symbol is not in the alphabet (and is not EPSILON)', () => {
    expect(() => { nfa.addTransition('q0', 'q1', 'x'); }).toThrow(
      /symbol .* not in alphabet/i,
    );
  });

  it('throws when the fromState does not exist', () => {
    expect(() => { nfa.addTransition('q99', 'q1', 'a'); }).toThrow(
      /state .* does not exist/i,
    );
  });

  it('throws when the toState does not exist', () => {
    expect(() => { nfa.addTransition('q0', 'q99', 'a'); }).toThrow(
      /state .* does not exist/i,
    );
  });

  it('does NOT throw for duplicate (fromState, symbol) pairs — NFAs are non-deterministic', () => {
    nfa.addTransition('q0', 'q1', 'a');
    expect(() => { nfa.addTransition('q0', 'q2', 'a'); }).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. getEpsilonClosure
//
// Reference NFA for closure tests (over alphabet {a}):
//
//   q0 —ε→ q1
//   q0 —ε→ q2
//   q1 —ε→ q3
//   q2 —a→ q3   (regular, not epsilon)
//
// ε-closure(q0) = {q0, q1, q2, q3}  (q3 reached via q0→q1→q3)
// ε-closure(q1) = {q1, q3}
// ε-closure(q2) = {q2}              (q2 has no ε-transition)
// ε-closure(q3) = {q3}              (q3 has no ε-transition)
// ε-closure({q1, q2}) = {q1, q2, q3}
// ─────────────────────────────────────────────────────────────────────────────

function buildEpsilonNFA(): NFA {
  const s0: State = { id: 'q0', name: 'q0', isInitial: true,  isAccepting: false };
  const s1: State = { id: 'q1', name: 'q1', isInitial: false, isAccepting: false };
  const s2: State = { id: 'q2', name: 'q2', isInitial: false, isAccepting: false };
  const s3: State = { id: 'q3', name: 'q3', isInitial: false, isAccepting: true  };

  const nfa = new NFA([s0, s1, s2, s3], new Set(['a']));
  nfa.addTransition('q0', 'q1', EPSILON);
  nfa.addTransition('q0', 'q2', EPSILON);
  nfa.addTransition('q1', 'q3', EPSILON);
  nfa.addTransition('q2', 'q3', 'a'); // regular — must NOT appear in ε-closure

  return nfa;
}

describe('NFA — getEpsilonClosure', () => {
  let nfa: NFA;

  beforeEach(() => {
    nfa = buildEpsilonNFA();
  });

  it('closure of a single state with no ε-transitions is just that state', () => {
    const closure = nfa.getEpsilonClosure(new Set(['q3']));
    expect(closure).toEqual(new Set(['q3']));
  });

  it('closure of q2 (only a regular transition out) is just {q2}', () => {
    const closure = nfa.getEpsilonClosure(new Set(['q2']));
    expect(closure).toEqual(new Set(['q2']));
  });

  it('closure of q1 follows one ε-hop to q3', () => {
    const closure = nfa.getEpsilonClosure(new Set(['q1']));
    expect(closure).toEqual(new Set(['q1', 'q3']));
  });

  it('closure of q0 reaches q1, q2, and q3 transitively', () => {
    const closure = nfa.getEpsilonClosure(new Set(['q0']));
    expect(closure).toEqual(new Set(['q0', 'q1', 'q2', 'q3']));
  });

  it('closure of a set {q1, q2} unions individual closures', () => {
    const closure = nfa.getEpsilonClosure(new Set(['q1', 'q2']));
    expect(closure).toEqual(new Set(['q1', 'q2', 'q3']));
  });

  it('handles a self-loop ε-transition without infinite recursion', () => {
    // Add q3 —ε→ q3 self-loop; closure(q3) must still terminate as {q3}.
    nfa.addTransition('q3', 'q3', EPSILON);
    const closure = nfa.getEpsilonClosure(new Set(['q3']));
    expect(closure).toEqual(new Set(['q3']));
  });

  it('handles a cycle between states without infinite recursion', () => {
    // Add q3 —ε→ q0 creating a cycle q0→q1→q3→q0...
    nfa.addTransition('q3', 'q0', EPSILON);
    const closure = nfa.getEpsilonClosure(new Set(['q0']));
    // All states reachable via ε from q0
    expect(closure).toEqual(new Set(['q0', 'q1', 'q2', 'q3']));
  });

  it('throws when a state id in the input set does not exist', () => {
    expect(() => nfa.getEpsilonClosure(new Set(['q99']))).toThrow(
      /state .* does not exist/i,
    );
  });

  it('returns an empty set for an empty input set', () => {
    const closure = nfa.getEpsilonClosure(new Set());
    expect(closure).toEqual(new Set());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. simulate()
//
// NFA-A: strings over {a,b} ending in "ab"  (pure NFA — no ε transitions)
//
//   q0 (start) —a→ q0,  —b→ q0,  —a→ q1   (nondeterminism on 'a')
//   q1          —b→ q2
//   q2 (accept)
//
// NFA-ε: strings over {0,1} accepted by an NFA with ε-transitions.
//   Recognises: strings ending in "01" via epsilon path.
//   q0 (start) —ε→ q1,  —0→ q0,  —1→ q0
//   q1          —0→ q2
//   q2          —1→ q3 (accept)
// ─────────────────────────────────────────────────────────────────────────────

/** NFA for strings over {a,b} ending in "ab" (no epsilon transitions). */
function buildEndsInAbNFA(): NFA {
  const s0: State = { id: 'q0', name: 'start',  isInitial: true,  isAccepting: false };
  const s1: State = { id: 'q1', name: 'saw-a',  isInitial: false, isAccepting: false };
  const s2: State = { id: 'q2', name: 'saw-ab', isInitial: false, isAccepting: true  };

  const nfa = new NFA([s0, s1, s2], new Set(['a', 'b']));
  // Stay in q0 on any symbol (catch-all loop)
  nfa.addTransition('q0', 'q0', 'a');
  nfa.addTransition('q0', 'q0', 'b');
  // Non-deterministic branch: guess we are at the start of the final "ab"
  nfa.addTransition('q0', 'q1', 'a');
  nfa.addTransition('q1', 'q2', 'b');

  return nfa;
}

/** NFA-ε for strings over {0,1} ending in "01". Uses epsilon transition. */
function buildEpsilonSimNFA(): NFA {
  const s0: State = { id: 'q0', name: 'start',  isInitial: true,  isAccepting: false };
  const s1: State = { id: 'q1', name: 'mid',    isInitial: false, isAccepting: false };
  const s2: State = { id: 'q2', name: 'saw-0',  isInitial: false, isAccepting: false };
  const s3: State = { id: 'q3', name: 'accept', isInitial: false, isAccepting: true  };

  const nfa = new NFA([s0, s1, s2, s3], new Set(['0', '1']));
  // Looping path
  nfa.addTransition('q0', 'q0', '0');
  nfa.addTransition('q0', 'q0', '1');
  // Epsilon hop to start the "01" suffix path
  nfa.addTransition('q0', 'q1', EPSILON);
  nfa.addTransition('q1', 'q2', '0');
  nfa.addTransition('q2', 'q3', '1');

  return nfa;
}

describe('NFA — simulate() ends-in-"ab" (pure non-determinism)', () => {
  let nfa: NFA;

  beforeEach(() => {
    nfa = buildEndsInAbNFA();
  });

  it('accepts "ab"', () => {
    expect(nfa.simulate('ab')).toBe(true);
  });

  it('accepts "aab"', () => {
    expect(nfa.simulate('aab')).toBe(true);
  });

  it('accepts "bab"', () => {
    expect(nfa.simulate('bab')).toBe(true);
  });

  it('accepts "ababab"', () => {
    expect(nfa.simulate('ababab')).toBe(true);
  });

  it('rejects ""  (empty string)', () => {
    expect(nfa.simulate('')).toBe(false);
  });

  it('rejects "a"', () => {
    expect(nfa.simulate('a')).toBe(false);
  });

  it('rejects "ba"', () => {
    expect(nfa.simulate('ba')).toBe(false);
  });

  it('rejects "aba"', () => {
    expect(nfa.simulate('aba')).toBe(false);
  });
});

describe('NFA — simulate() ends-in-"01" (epsilon + non-determinism)', () => {
  let nfa: NFA;

  beforeEach(() => {
    nfa = buildEpsilonSimNFA();
  });

  it('accepts "01"', () => {
    expect(nfa.simulate('01')).toBe(true);
  });

  it('accepts "001"', () => {
    expect(nfa.simulate('001')).toBe(true);
  });

  it('accepts "101"', () => {
    expect(nfa.simulate('101')).toBe(true);
  });

  it('accepts "0101"', () => {
    expect(nfa.simulate('0101')).toBe(true);
  });

  it('rejects "0"', () => {
    expect(nfa.simulate('0')).toBe(false);
  });

  it('rejects "10"', () => {
    expect(nfa.simulate('10')).toBe(false);
  });

  it('rejects "011"', () => {
    expect(nfa.simulate('011')).toBe(false);
  });

  it('throws when a symbol is not in the alphabet', () => {
    expect(() => nfa.simulate('01x')).toThrow(/not in alphabet/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. convertToDFA()
//
// Strategy: build a known NFA, convert it, then verify the resulting DFA
// accepts exactly the same language as the NFA by cross-testing a corpus
// of accepted and rejected strings.
// ─────────────────────────────────────────────────────────────────────────────

describe('NFA — convertToDFA() ends-in-"ab"', () => {
  it('produces a DFA that accepts every string the NFA accepts', () => {
    const nfa = buildEndsInAbNFA();
    const dfa = nfa.convertToDFA();

    const accepted = ['ab', 'aab', 'bab', 'ababab', 'bbab'];
    for (const s of accepted) {
      expect(dfa.simulate(s)).toBe(true);
    }
  });

  it('produces a DFA that rejects every string the NFA rejects', () => {
    const nfa = buildEndsInAbNFA();
    const dfa = nfa.convertToDFA();

    const rejected = ['', 'a', 'b', 'ba', 'aba', 'bb'];
    for (const s of rejected) {
      expect(dfa.simulate(s)).toBe(false);
    }
  });

  it('the resulting DFA has the same alphabet as the NFA', () => {
    const nfa = buildEndsInAbNFA();
    const dfa = nfa.convertToDFA();
    expect(dfa.data.alphabet).toEqual(nfa.data.alphabet);
  });

  it('the resulting DFA has exactly one initial state', () => {
    const nfa = buildEndsInAbNFA();
    const dfa = nfa.convertToDFA();
    const initials = [...dfa.data.states.values()].filter(s => s.isInitial);
    expect(initials).toHaveLength(1);
  });
});

describe('NFA — convertToDFA() ends-in-"01" (with epsilon transitions)', () => {
  it('produces a DFA that accepts every string the NFA accepts', () => {
    const nfa = buildEpsilonSimNFA();
    const dfa = nfa.convertToDFA();

    const accepted = ['01', '001', '101', '0101', '1101'];
    for (const s of accepted) {
      expect(dfa.simulate(s)).toBe(true);
    }
  });

  it('produces a DFA that rejects every string the NFA rejects', () => {
    const nfa = buildEpsilonSimNFA();
    const dfa = nfa.convertToDFA();

    const rejected = ['', '0', '1', '10', '011', '110'];
    for (const s of rejected) {
      expect(dfa.simulate(s)).toBe(false);
    }
  });
});

