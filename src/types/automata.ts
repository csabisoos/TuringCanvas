/**
 * Core TypeScript interfaces for the Automata domain model.
 * These are pure data structures with no runtime behaviour.
 * They represent the mathematical components of a Deterministic Finite Automaton (DFA).
 */

/** A single state in an automaton. */
export interface State {
  /** Unique identifier for this state (e.g. "q0", "q1"). */
  id: string;
  /** Human-readable display name (e.g. "Start", "Accept"). */
  name: string;
  /** Whether this state is an accepting (final) state. */
  isAccepting: boolean;
  /** Whether this state is the initial (start) state. */
  isInitial: boolean;
}

/**
 * The input alphabet — the finite, non-empty set of symbols the automaton
 * is defined over (e.g. `new Set(["0", "1"])` for a binary alphabet).
 */
export type Alphabet = Set<string>;

/** A single deterministic transition δ(fromStateId, symbol) = toStateId. */
export interface Transition {
  /** The state this transition originates from. */
  fromStateId: string;
  /** The symbol consumed by this transition. Must be a member of the alphabet. */
  symbol: string;
  /** The state this transition leads to. */
  toStateId: string;
}

/**
 * The raw data structure representing a complete DFA.
 * Corresponds to the 5-tuple (Q, Σ, δ, q₀, F):
 *   Q  = states
 *   Σ  = alphabet
 *   δ  = transitions
 *   q₀ = the unique state where isInitial === true
 *   F  = all states where isAccepting === true
 */
export interface DFAData {
  /** All states Q in the automaton, keyed by their id for O(1) look-ups. */
  states: Map<string, State>;
  /** The input alphabet Σ. */
  alphabet: Alphabet;
  /**
   * The transition function δ, stored as a flat list.
   * In a valid DFA each (fromStateId, symbol) pair appears at most once.
   */
  transitions: Transition[];
}
