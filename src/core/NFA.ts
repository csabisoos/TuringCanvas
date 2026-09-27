/**
 * NFA — Nondeterministic Finite Automaton (with ε-transitions)
 *
 * Pure TypeScript. No UI, no React, no DOM.
 *
 * Public API:
 *   constructor(states, alphabet)
 *   addTransition(from, to, symbol)   — allows multiple targets per (state, symbol)
 *   getEpsilonClosure(states)         — BFS/iterative fixed-point over ε-transitions
 *   simulate(input)                   — parallel set-of-states execution
 *   convertToDFA()                    — Rabin-Scott powerset / subset construction
 */
import { EPSILON } from '../types/automata';
import type { NFAData, State } from '../types/automata';
import { DFA } from './DFA';

export class NFA {
  /** The underlying raw data structure (publicly readable for tests & store). */
  readonly data: NFAData;

  /**
   * Construct a new NFA.
   *
   * @param states   - Array of states Q. Must be non-empty, contain no duplicate
   *                   ids, and have exactly one initial state.
   * @param alphabet - Input alphabet Σ (must not include ε; must be non-empty).
   * @throws {Error} on any violated structural invariant.
   */
  constructor(states: State[], alphabet: Set<string>) {
    // --- Guard: non-empty alphabet ---
    if (alphabet.size === 0) {
      throw new Error('NFA invariant violated: alphabet must be non-empty.');
    }

    // --- Guard: non-empty state set ---
    if (states.length === 0) {
      throw new Error('NFA invariant violated: state set must be non-empty.');
    }

    // --- Build state map, checking for duplicate ids ---
    const stateMap = new Map<string, State>();
    for (const state of states) {
      if (stateMap.has(state.id)) {
        throw new Error(
          `NFA invariant violated: duplicate state id "${state.id}".`,
        );
      }
      stateMap.set(state.id, state);
    }

    // --- Guard: exactly one initial state ---
    const initialCount = states.filter((s) => s.isInitial).length;
    if (initialCount !== 1) {
      throw new Error(
        `NFA invariant violated: expected exactly 1 initial state, got ${String(initialCount)}.`,
      );
    }

    this.data = {
      states: stateMap,
      alphabet: new Set(alphabet), // defensive copy
      transitions: [],
    };
  }

  /**
   * Add a (possibly nondeterministic or epsilon) transition.
   *
   * Key difference from DFA.addTransition: duplicate (fromStateId, symbol)
   * pairs are **allowed** — that is the definition of nondeterminism.
   *
   * @param from   - Id of the originating state.
   * @param to     - Id of the destination state.
   * @param symbol - Alphabet symbol, or `EPSILON` (`""`) for an ε-transition.
   * @throws {Error} if the symbol is not in Σ and is not EPSILON,
   *                 or if either state id does not exist.
   */
  addTransition(from: string, to: string, symbol: string): void {
    // --- Guard: symbol must be in Σ OR be EPSILON ---
    if (symbol !== EPSILON && !this.data.alphabet.has(symbol)) {
      throw new Error(
        `NFA error: symbol "${symbol}" is not in alphabet and is not EPSILON. ` +
          `Alphabet: {${[...this.data.alphabet].join(', ')}}.`,
      );
    }

    // --- Guard: fromState must exist ---
    if (!this.data.states.has(from)) {
      throw new Error(
        `NFA error: state "${from}" does not exist in this automaton.`,
      );
    }

    // --- Guard: toState must exist ---
    if (!this.data.states.has(to)) {
      throw new Error(
        `NFA error: state "${to}" does not exist in this automaton.`,
      );
    }

    // No uniqueness check — NFAs are nondeterministic by design.
    this.data.transitions.push({ fromStateId: from, toStateId: to, symbol });
  }

  /**
   * Compute the **ε-closure** of a set of states.
   *
   * ε-closure(T) = the set of all NFA states reachable from any state in T
   * by following zero or more ε-transitions.
   *
   * Implementation: iterative BFS / worklist algorithm.
   * - Correctly handles self-loops and ε-cycles (visited set prevents revisits).
   * - Does NOT mutate `this.data`.
   *
   * @param states - Set of state ids to start from.
   * @returns A new `Set<string>` containing all reachable state ids (including
   *          the input states themselves).
   * @throws {Error} if any id in `states` does not exist in this NFA.
   */
  getEpsilonClosure(states: Set<string>): Set<string> {
    // Validate all input state ids up front.
    for (const id of states) {
      if (!this.data.states.has(id)) {
        throw new Error(
          `NFA getEpsilonClosure error: state "${id}" does not exist.`,
        );
      }
    }

    // Short-circuit for empty input.
    if (states.size === 0) return new Set<string>();

    // Build a fast epsilon-adjacency index:  stateId → Set<toStateId>
    // Built once per call; avoids repeated full-list scans in the BFS.
    const epsilonEdges = new Map<string, Set<string>>();
    for (const t of this.data.transitions) {
      if (t.symbol === EPSILON) {
        let targets = epsilonEdges.get(t.fromStateId);
        if (targets === undefined) {
          targets = new Set<string>();
          epsilonEdges.set(t.fromStateId, targets);
        }
        targets.add(t.toStateId);
      }
    }

    // Iterative BFS worklist.
    const closure = new Set<string>(states);  // visited / result set
    const worklist: string[] = [...states];   // queue of states to expand

    while (worklist.length > 0) {
      // worklist.length > 0 guarantees pop() is defined.
      const current = worklist.pop();
      if (current === undefined) break;
      const neighbors = epsilonEdges.get(current);
      if (neighbors === undefined) continue;

      for (const neighbor of neighbors) {
        if (!closure.has(neighbor)) {
          closure.add(neighbor);
          worklist.push(neighbor);
        }
      }
    }

    return closure;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private helper: move(currentStates, symbol)
  //
  // Returns the set of NFA states reachable from any state in currentStates
  // by consuming exactly one symbol (non-epsilon). Does NOT compute closure.
  // ─────────────────────────────────────────────────────────────────────────
  private move(currentStates: Set<string>, symbol: string): Set<string> {
    const result = new Set<string>();
    for (const t of this.data.transitions) {
      if (t.symbol === symbol && currentStates.has(t.fromStateId)) {
        result.add(t.toStateId);
      }
    }
    return result;
  }

  /**
   * Simulate the NFA on an input string using the **parallel set-of-states**
   * algorithm.
   *
   * Algorithm per symbol:
   *   1. Expand current states with their ε-closure.
   *   2. Consume the symbol: move() to all reachable next states.
   *   3. Expand next states with their ε-closure.
   * Accept iff any state in the final set is accepting.
   *
   * The method is **pure** — it never mutates `this.data`.
   *
   * @param input - String to process (each Unicode code-point = one symbol).
   * @returns `true` if the NFA accepts, `false` if it rejects.
   * @throws {Error} if any symbol is not in the alphabet.
   */
  simulate(input: string): boolean {
    // Initial state + its epsilon closure.
    // The constructor guarantees exactly one initial state exists.
    const initialState = [...this.data.states.values()].find((s) => s.isInitial);
    if (initialState === undefined) {
      throw new Error('NFA simulate: no initial state found (should be impossible).');
    }
    let currentStates = this.getEpsilonClosure(new Set([initialState.id]));

    for (const symbol of Array.from(input)) {
      // Guard: symbol must be in Σ.
      if (!this.data.alphabet.has(symbol)) {
        throw new Error(
          `NFA simulate error: symbol "${symbol}" is not in alphabet. ` +
            `Alphabet: {${[...this.data.alphabet].join(', ')}}.`,
        );
      }

      // Move on symbol, then take ε-closure of the resulting set.
      const afterMove = this.move(currentStates, symbol);
      currentStates = this.getEpsilonClosure(afterMove);

      // If no states remain the NFA has implicitly rejected (dead configuration).
      if (currentStates.size === 0) return false;
    }

    // Accept iff at least one current state is an accepting state.
    return [...currentStates].some((id) => {
      const state = this.data.states.get(id);
      return state?.isAccepting ?? false;
    });
  }

  /**
   * Convert this NFA to an equivalent DFA using the **Rabin-Scott Powerset
   * Construction** (Subset Construction) algorithm.
   *
   * Each DFA state represents a *subset* of NFA states (a macro-state).
   * The DFA state id is the sorted, pipe-delimited list of NFA state ids
   * in the subset, e.g. `"q0|q1|q3"`. The dead (trap) state uses id `"∅"`.
   *
   * The method is **pure** — it never mutates `this.data`.
   *
   * @returns A new, fully-wired `DFA` instance that recognises the same
   *          language as this NFA.
   */
  convertToDFA(): DFA {
    // Helper: canonical string key for a set of NFA state ids.
    const setKey = (s: Set<string>): string =>
      [...s].sort().join('|') || '∅';

    // Helper: is any state in the subset an NFA accepting state?
    const isAcceptingSubset = (subset: Set<string>): boolean =>
      [...subset].some(id => this.data.states.get(id)?.isAccepting ?? false);

    // ---- Powerset construction (BFS over subsets) ----

    // Start state of the DFA = ε-closure of the NFA's initial state.
    const initialNFAState = [...this.data.states.values()].find((s) => s.isInitial);
    if (initialNFAState === undefined) {
      throw new Error('NFA convertToDFA: no initial state found (should be impossible).');
    }
    const startSubset  = this.getEpsilonClosure(new Set([initialNFAState.id]));
    const startKey     = setKey(startSubset);

    // Maps DFA state key → the NFA subset it represents.
    const subsetMap = new Map<string, Set<string>>();
    subsetMap.set(startKey, startSubset);

    // Transition table: dfaFromKey → symbol → dfaToKey
    const transTable = new Map<string, Map<string, string>>();

    const worklist: string[] = [startKey];

    while (worklist.length > 0) {
      const currentKey    = worklist.pop();
      if (currentKey === undefined) break;
      const currentSubset = subsetMap.get(currentKey);
      if (currentSubset === undefined) continue;
      const row           = new Map<string, string>();
      transTable.set(currentKey, row);

      for (const symbol of this.data.alphabet) {
        // 1. Move on symbol.
        const moved = this.move(currentSubset, symbol);
        // 2. ε-closure of the result.
        const nextSubset = this.getEpsilonClosure(moved);
        const nextKey    = setKey(nextSubset);

        row.set(symbol, nextKey);

        // Enqueue new subsets (including the dead/empty subset).
        if (!subsetMap.has(nextKey)) {
          subsetMap.set(nextKey, nextSubset);
          worklist.push(nextKey);
        }
      }
    }

    // ---- Build the DFA instance ----

    // Create State objects for each DFA macro-state.
    const dfaStates: State[] = [...subsetMap.keys()].map((key) => ({
      id:          key,
      name:        key,
      isInitial:   key === startKey,
      isAccepting: isAcceptingSubset(subsetMap.get(key) ?? new Set<string>()),
    }));

    const dfa = new DFA(dfaStates, new Set(this.data.alphabet));

    // Wire up the transitions.
    for (const [fromKey, row] of transTable) {
      for (const [symbol, toKey] of row) {
        dfa.addTransition(fromKey, toKey, symbol);
      }
    }

    return dfa;
  }
}
