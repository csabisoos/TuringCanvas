/**
 * Core TypeScript interfaces for the Automata domain model.
 * These are pure data structures with no runtime behaviour.
 * Covers both Deterministic (DFA) and Nondeterministic (NFA) Finite Automata.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────────────

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
 * Epsilon (ε) is never included in the alphabet.
 */
export type Alphabet = Set<string>;

/**
 * Canonical sentinel for an epsilon (ε) transition.
 * Using a named constant keeps NFA code readable and avoids bare empty-string
 * comparisons scattered throughout the codebase.
 */
export const EPSILON = '' as const;
export type EpsilonSymbol = typeof EPSILON;

// ─────────────────────────────────────────────────────────────────────────────
// DFA types
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// NFA types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single nondeterministic transition.
 * `symbol` is either a regular alphabet symbol or EPSILON (`""`).
 * Unlike a DFA, multiple NFATransitions may share the same (fromStateId, symbol) pair.
 */
export interface NFATransition {
  fromStateId: string;
  /** Alphabet symbol consumed, or `EPSILON` (`""`) for an ε-transition. */
  symbol: string | EpsilonSymbol;
  toStateId: string;
}

/**
 * The raw data structure representing an NFA (with ε-transitions).
 * Corresponds to the 5-tuple (Q, Σ, δ, q₀, F) where δ : Q × (Σ ∪ {ε}) → 2^Q.
 *   Q  = states
 *   Σ  = alphabet  (does NOT include ε)
 *   δ  = transitions  (may include ε-transitions)
 *   q₀ = the unique state where isInitial === true
 *   F  = all states where isAccepting === true
 */
export interface NFAData {
  /** All states Q, keyed by id. */
  states: Map<string, State>;
  /** The input alphabet Σ. ε is implicitly available and not listed here. */
  alphabet: Alphabet;
  /**
   * The transition relation δ.
   * Multiple entries with the same (fromStateId, symbol) are allowed —
   * that is what makes the automaton nondeterministic.
   */
  transitions: NFATransition[];
}

