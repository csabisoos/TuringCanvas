/**
 * Unit tests for the DFA class.
 * Written BEFORE the implementation (TDD Red phase).
 * Tests cover: initialization, valid transition insertion,
 * and all explicit error conditions.
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
    expect(() => dfa.addTransition('q0', 'q1', 'x')).toThrow(
      /symbol .* not in alphabet/i,
    );
  });

  it('throws when the fromState does not exist', () => {
    expect(() => dfa.addTransition('q99', 'q1', '0')).toThrow(
      /state .* does not exist/i,
    );
  });

  it('throws when the toState does not exist', () => {
    expect(() => dfa.addTransition('q0', 'q99', '0')).toThrow(
      /state .* does not exist/i,
    );
  });

  it('throws when a duplicate transition (same fromState + symbol) already exists', () => {
    dfa.addTransition('q0', 'q1', '0');
    // In a DFA, δ must be a function — no two transitions share (from, symbol).
    expect(() => dfa.addTransition('q0', 'q2', '0')).toThrow(
      /transition .* already defined/i,
    );
  });
});
