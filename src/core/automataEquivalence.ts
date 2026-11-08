/**
 * automataEquivalence — Language Equivalence & Counterexample Detection
 *
 * Implements shortest counterexample generation via symmetric difference BFS.
 * Pure TypeScript: zero UI, zero React, zero DOM.
 */
import type { DFAData } from '../types/automata';

export interface EquivalenceCheckResult {
  areEquivalent: boolean;
  counterexample: string | null;
  description: string;
}

export function checkEquivalence(
  m1: DFAData,
  m2: DFAData,
): EquivalenceCheckResult {
  // Find initial states
  let q01: string | null = null;
  for (const s of m1.states.values()) {
    if (s.isInitial) {
      q01 = s.id;
      break;
    }
  }

  let q02: string | null = null;
  for (const s of m2.states.values()) {
    if (s.isInitial) {
      q02 = s.id;
      break;
    }
  }

  if (q01 === null || q02 === null) {
    throw new Error('Both automata must have an initial state to check equivalence.');
  }

  // Build transition lookups: stateId -> symbol -> targetId
  const delta1 = new Map<string, Map<string, string>>();
  for (const s of m1.states.values()) {
    delta1.set(s.id, new Map());
  }
  for (const t of m1.transitions) {
    delta1.get(t.fromStateId)?.set(t.symbol, t.toStateId);
  }

  const delta2 = new Map<string, Map<string, string>>();
  for (const s of m2.states.values()) {
    delta2.set(s.id, new Map());
  }
  for (const t of m2.transitions) {
    delta2.get(t.fromStateId)?.set(t.symbol, t.toStateId);
  }

  // Combined alphabet (sorted for deterministic traversal order)
  const combinedAlphabet = Array.from(
    new Set([...m1.alphabet, ...m2.alphabet]),
  ).sort();

  // BFS over the product automaton state space Q1 x Q2
  interface QueueItem {
    s1: string | null;
    s2: string | null;
    path: string;
  }

  const initialKey = `${q01},${q02}`;
  const visited = new Set<string>([initialKey]);
  const queue: QueueItem[] = [{ s1: q01, s2: q02, path: '' }];

  while (queue.length > 0) {
    const curr = queue.shift();
    if (!curr) continue;

    // Check if the current product state is accepting in the symmetric difference
    const acc1 =
      curr.s1 !== null && (m1.states.get(curr.s1)?.isAccepting ?? false);
    const acc2 =
      curr.s2 !== null && (m2.states.get(curr.s2)?.isAccepting ?? false);

    if (acc1 !== acc2) {
      const displayPath = curr.path === '' ? 'ε (empty string)' : `"${curr.path}"`;
      const desc = acc1
        ? `${displayPath} is accepted by M1 but rejected by M2.`
        : `${displayPath} is rejected by M1 but accepted by M2.`;

      return {
        areEquivalent: false,
        counterexample: curr.path,
        description: desc,
      };
    }

    // Expand transitions for all symbols in the combined alphabet
    for (const symbol of combinedAlphabet) {
      const next1 =
        curr.s1 !== null ? (delta1.get(curr.s1)?.get(symbol) ?? null) : null;
      const next2 =
        curr.s2 !== null ? (delta2.get(curr.s2)?.get(symbol) ?? null) : null;

      const nextKey = `${next1 ?? 'TRAP'},${next2 ?? 'TRAP'}`;

      if (!visited.has(nextKey)) {
        visited.add(nextKey);
        queue.push({
          s1: next1,
          s2: next2,
          path: curr.path + symbol,
        });
      }
    }
  }

  return {
    areEquivalent: true,
    counterexample: null,
    description: 'The two automata are equivalent. L(M1) = L(M2).',
  };
}
