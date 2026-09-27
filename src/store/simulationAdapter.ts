/**
 * simulationAdapter.ts
 *
 * Translates UI graph data (AutomataNode[], AutomataEdge[]) into a core NFA
 * instance and computes the complete step-by-step traversal for a given input.
 *
 * Lives in src/store/ so it is exclusively used by the Zustand store layer.
 * No React, no DOM — pure TypeScript.
 *
 * Design:
 *  - We always build an NFA (not DFA). DFAs are a strict subset of NFAs, so
 *    this correctly handles both graph shapes without a separate detection step.
 *  - The visual edge symbol 'ε' is normalised to EPSILON ('') understood by the
 *    core NFA engine.
 *  - The alphabet is inferred from all non-ε symbols present on the edges.
 *  - One visual edge with symbols ['a', 'b'] expands into two NFA transitions.
 *  - Each element of the returned array is the Set<string> of active node ids
 *    AFTER consuming the symbol at that position (index 0 = after symbol[0]).
 *    The initial state set (before any symbol is consumed) is not included so
 *    that the caller can track it separately as the "step 0" position.
 */

import { NFA } from '../core/NFA';
import { EPSILON } from '../types/automata';
import type { State } from '../types/automata';
import type { AutomataNode, AutomataEdge } from '../types/ui';

// ── Public types ──────────────────────────────────────────────────────────────

export interface SimulationResult {
  /** Active node ids BEFORE the first symbol is consumed (the initial closure). */
  initialStep: Set<string>;
  /**
   * One entry per input symbol.  steps[i] = active node ids after consuming
   * input[i].  Empty set means the NFA is in a dead (reject) configuration.
   */
  steps: Set<string>[];
  /** Whether the NFA accepted the full input string. */
  accepted: boolean;
}

export type SimulationError =
  | { kind: 'NO_INITIAL_STATE' }
  | { kind: 'EMPTY_ALPHABET' }
  | { kind: 'ENGINE_ERROR'; message: string };

// ── Adapter ───────────────────────────────────────────────────────────────────

/**
 * Build the NFA from the current visual graph and compute all simulation steps.
 *
 * @returns `SimulationResult` on success, `SimulationError` on failure.
 *          The caller decides how to surface the error (store state vs. throw).
 */
export function buildAndSimulate(
  nodes: AutomataNode[],
  edges: AutomataEdge[],
  input: string,
): SimulationResult | SimulationError {
  // ── Guard: must have exactly one initial state ────────────────────────────
  const initialNodes = nodes.filter((n) => n.isInitial);
  if (initialNodes.length !== 1) {
    return { kind: 'NO_INITIAL_STATE' };
  }

  // ── Infer alphabet from all non-ε edge symbols ────────────────────────────
  // The visual 'ε' character is a display alias for EPSILON ('').
  const alphabet = new Set<string>();
  for (const edge of edges) {
    for (const sym of edge.symbols) {
      const normalised = sym === 'ε' ? EPSILON : sym;
      if (normalised !== EPSILON) {
        alphabet.add(normalised);
      }
    }
  }

  // If input is non-empty we need a non-empty alphabet to validate symbols.
  // If the graph has no labelled transitions but the input is non-empty →
  // every symbol is unknown → the NFA will dead-end (which is correct behaviour).
  // We add a synthetic placeholder so the NFA constructor doesn't throw.
  if (alphabet.size === 0) {
    // Use each unique char of the input itself as the "alphabet" so the engine
    // can process it without invariant violation.
    for (const ch of Array.from(input)) {
      if (ch !== 'ε') alphabet.add(ch);
    }
    // Still empty? The input is either empty or only 'ε' characters.
    // Use a placeholder that will never appear in the input so simulation works.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- size may be > 0 after the loop
    if (alphabet.size === 0) {
      alphabet.add('\x00');
    }
  }

  // ── Build NFA states ──────────────────────────────────────────────────────
  const coreStates: State[] = nodes.map((n) => ({
    id: n.id,
    name: n.label,
    isInitial: n.isInitial,
    isAccepting: n.isAccepting,
  }));

  let nfa: NFA;
  try {
    nfa = new NFA(coreStates, alphabet);
  } catch (err) {
    return { kind: 'ENGINE_ERROR', message: (err as Error).message };
  }

  // ── Add transitions ───────────────────────────────────────────────────────
  for (const edge of edges) {
    for (const sym of edge.symbols) {
      const normalised = sym === 'ε' ? EPSILON : sym;
      try {
        nfa.addTransition(edge.source, edge.target, normalised);
      } catch (err) {
        return { kind: 'ENGINE_ERROR', message: (err as Error).message };
      }
    }
  }

  // ── Compute step-by-step traversal ────────────────────────────────────────
  // We replicate the NFA simulation loop here so we can capture intermediate
  // state sets. The core NFA.simulate() only returns a boolean.

  // We know exactly one initial node exists (the guard above confirmed it).
  // Use a local variable to make it explicit and avoid the non-null assertion.
  const initialNode = nodes.find((n) => n.isInitial);
  if (initialNode === undefined) return { kind: 'NO_INITIAL_STATE' };

  const initialClosure = nfa.getEpsilonClosure(new Set([initialNode.id]));
  const steps: Set<string>[] = [];
  let currentStates = initialClosure;

  for (const symbol of Array.from(input)) {
    const normSym = symbol === 'ε' ? EPSILON : symbol;

    // Symbol not in alphabet → reject immediately.
    if (!alphabet.has(normSym)) {
      steps.push(new Set<string>());
      // Remaining symbols are all dead.
      const remaining = Array.from(input).length - steps.length;
      for (let i = 0; i < remaining; i++) {
        steps.push(new Set<string>());
      }
      return {
        initialStep: initialClosure,
        steps,
        accepted: false,
      };
    }

    // Move on symbol, then ε-close.
    const afterMove = new Set<string>();
    for (const t of nfa.data.transitions) {
      if (t.symbol === normSym && currentStates.has(t.fromStateId)) {
        afterMove.add(t.toStateId);
      }
    }
    currentStates = nfa.getEpsilonClosure(afterMove);
    steps.push(new Set(currentStates));
  }

  // Accept iff any current state is accepting.
  const accepted =
    currentStates.size > 0 &&
    [...currentStates].some((id) => {
      const state = nodes.find((n) => n.id === id);
      return state?.isAccepting ?? false;
    });

  return { initialStep: initialClosure, steps, accepted };
}
