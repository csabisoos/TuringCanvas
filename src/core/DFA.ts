/**
 * DFA — Deterministic Finite Automaton
 *
 * Wraps a DFAData structure and enforces all structural invariants.
 * This module is pure TypeScript: zero UI, zero React, zero DOM.
 *
 * Public API: constructor · addTransition · simulate
 */
import type { DFAData, State, Transition } from '../types/automata';

export class DFA {
  /** The underlying raw data structure (publicly readable for testing & store). */
  readonly data: DFAData;

  /**
   * Construct a new DFA.
   *
   * @param states   - Array of states Q. Must be non-empty, contain no duplicate
   *                   ids, and have exactly one initial state.
   * @param alphabet - Input alphabet Σ. Must be non-empty.
   * @throws {Error} on any violated invariant.
   */
  constructor(states: State[], alphabet: Set<string>) {
    // --- Guard: non-empty alphabet ---
    if (alphabet.size === 0) {
      throw new Error('DFA invariant violated: alphabet must be non-empty.');
    }

    // --- Guard: non-empty state set ---
    if (states.length === 0) {
      throw new Error('DFA invariant violated: state set must be non-empty.');
    }

    // --- Build the state map while checking for duplicates ---
    const stateMap = new Map<string, State>();
    for (const state of states) {
      if (stateMap.has(state.id)) {
        throw new Error(
          `DFA invariant violated: duplicate state id "${state.id}".`,
        );
      }
      stateMap.set(state.id, state);
    }

    // --- Guard: exactly one initial state ---
    const initialStates = states.filter((s) => s.isInitial);
    if (initialStates.length !== 1) {
      throw new Error(
        `DFA invariant violated: expected exactly 1 initial state, got ${String(initialStates.length)}.`,
      );
    }

    this.data = {
      states: stateMap,
      alphabet: new Set(alphabet), // defensive copy
      transitions: [],
    };
  }

  /**
   * Add a deterministic transition δ(from, symbol) = to.
   *
   * @param from   - Id of the originating state.
   * @param to     - Id of the destination state.
   * @param symbol - The symbol consumed (must be in Σ).
   * @throws {Error} if the symbol is not in the alphabet, either state does
   *                 not exist, or a transition for (from, symbol) is already defined.
   */
  addTransition(from: string, to: string, symbol: string): void {
    // --- Guard: symbol must be in alphabet ---
    if (!this.data.alphabet.has(symbol)) {
      throw new Error(
        `DFA error: symbol "${symbol}" is not in alphabet. ` +
          `Alphabet: {${[...this.data.alphabet].join(', ')}}.`,
      );
    }

    // --- Guard: fromState must exist ---
    if (!this.data.states.has(from)) {
      throw new Error(
        `DFA error: state "${from}" does not exist in this automaton.`,
      );
    }

    // --- Guard: toState must exist ---
    if (!this.data.states.has(to)) {
      throw new Error(
        `DFA error: state "${to}" does not exist in this automaton.`,
      );
    }

    // --- Guard: DFA determinism — (from, symbol) must be unique ---
    const existing = this.data.transitions.find(
      (t: Transition) => t.fromStateId === from && t.symbol === symbol,
    );
    if (existing !== undefined) {
      throw new Error(
        `DFA error: transition for (state="${from}", symbol="${symbol}") is already defined ` +
          `(leads to "${existing.toStateId}"). ` +
          'A DFA transition function must be deterministic.',
      );
    }

    this.data.transitions.push({ fromStateId: from, toStateId: to, symbol });
  }

  /**
   * Simulate the DFA on the given input string.
   *
   * The method is **pure** — it never mutates `this.data`.
   *
   * @param input - The string to process. Each Unicode code-point is treated
   *                as one symbol; multi-character symbols are not supported.
   * @returns `true` if the DFA accepts the input, `false` if it rejects it.
   * @throws {Error} if a symbol is not in Σ, or if the transition function is
   *                 undefined for the current (state, symbol) pair (incomplete DFA).
   */
  simulate(input: string): boolean {
    // Locate the unique initial state (constructor guarantees exactly one).
    const initialStateEntry = [...this.data.states.values()].find((s) => s.isInitial);
    if (initialStateEntry === undefined) {
      throw new Error('DFA simulate: no initial state found (should be impossible).');
    }
    let currentStateId = initialStateEntry.id;

    // Build a lookup map for O(1) transition resolution.
    // Key: "<fromStateId>|<symbol>"
    const transitionMap = new Map<string, string>();
    for (const t of this.data.transitions) {
      transitionMap.set(`${t.fromStateId}|${t.symbol}`, t.toStateId);
    }

    // Process each symbol — using Array.from to correctly iterate Unicode code-points.
    for (const symbol of Array.from(input)) {
      // Guard: symbol must be in Σ.
      if (!this.data.alphabet.has(symbol)) {
        throw new Error(
          `DFA simulate error: symbol "${symbol}" is not in alphabet. ` +
            `Alphabet: {${[...this.data.alphabet].join(', ')}}.`,
        );
      }

      // Guard: transition must be defined (strict / complete DFA requirement).
      const nextStateId = transitionMap.get(`${currentStateId}|${symbol}`);
      if (nextStateId === undefined) {
        throw new Error(
          `DFA simulate error: no transition defined for ` +
            `(state="${currentStateId}", symbol="${symbol}"). ` +
            'Ensure the DFA is complete before simulating.',
        );
      }

      currentStateId = nextStateId;
    }

    // Accept iff the final state is an accepting state.
    const finalState = this.data.states.get(currentStateId);
    return finalState?.isAccepting ?? false;
  }
}
