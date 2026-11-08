/**
 * DFAMinimizer — State Minimization via Table-Filling & Equivalence Partitioning
 *
 * This module is pure TypeScript: zero UI, zero React, zero DOM.
 */
import { DFA } from './DFA';
import { applyCircularLayout } from './layout/graphLayout';
import type { DFAData, State, Transition } from '../types/automata';
import type { AutomataEdge, AutomataNode } from '../types/ui';

export interface MinimizationResult {
  unreachableStates: string[];
  distinguishablePairs: Set<string>; // "qA,qB" where qA < qB
  partitions: Set<string>[]; // Final equivalence classes
  partitionSteps: Set<string>[][]; // History of partition refinements for visualization
  minimalDFA: DFA;
}

export const DFAMinimizer = {
  /**
   * Helper to create a canonical pair key for two state IDs.
   */
  makePairKey(stateA: string, stateB: string): string {
    return stateA < stateB ? `${stateA},${stateB}` : `${stateB},${stateA}`;
  },

  /**
   * Helper to convert visual canvas nodes/edges to DFAData.
   */
  buildDFADataFromCanvas(
    nodes: AutomataNode[],
    edges: AutomataEdge[],
  ): { dfaData?: DFAData; error?: string } {
    const initialNodes = nodes.filter((n) => n.isInitial);
    if (initialNodes.length !== 1) {
      return { error: 'Automaton must have exactly one initial state.' };
    }

    const alphabet = new Set<string>();
    for (const e of edges) {
      for (const s of e.symbols) {
        if (s === 'ε' || s === '') {
          return {
            error:
              'Automaton contains epsilon (ε) transitions. Convert NFA to DFA first.',
          };
        }
        alphabet.add(s);
      }
    }

    if (alphabet.size === 0) {
      return { error: 'Alphabet is empty. Please add transition symbols.' };
    }

    const stateMap = new Map<string, State>();
    for (const n of nodes) {
      stateMap.set(n.id, {
        id: n.id,
        name: n.label,
        isInitial: n.isInitial,
        isAccepting: n.isAccepting,
      });
    }

    const transitions: Transition[] = [];
    const seen = new Set<string>();

    for (const e of edges) {
      for (const s of e.symbols) {
        const key = `${e.source}:${s}`;
        if (seen.has(key)) {
          return {
            error: `Nondeterministic branch detected at state for symbol "${s}". Convert NFA to DFA first.`,
          };
        }
        seen.add(key);
        transitions.push({
          fromStateId: e.source,
          toStateId: e.target,
          symbol: s,
        });
      }
    }

    return {
      dfaData: {
        states: stateMap,
        alphabet,
        transitions,
      },
    };
  },

  /**
   * Converts a minimal DFA back into visual AutomataNode[] and AutomataEdge[].
   */
  minimalDfaToVisualGraph(minimalDfa: DFA): {
    nodes: AutomataNode[];
    edges: AutomataEdge[];
  } {
    const rawNodes: AutomataNode[] = [];
    for (const s of minimalDfa.data.states.values()) {
      rawNodes.push({
        id: s.id,
        position: { x: 0, y: 0 },
        label: s.name,
        isInitial: s.isInitial,
        isAccepting: s.isAccepting,
      });
    }

    const nodes = applyCircularLayout(rawNodes);

    const edgeMap = new Map<
      string,
      { source: string; target: string; symbols: Set<string> }
    >();
    for (const t of minimalDfa.data.transitions) {
      const pairKey = `${t.fromStateId}->${t.toStateId}`;
      let entry = edgeMap.get(pairKey);
      if (!entry) {
        entry = { source: t.fromStateId, target: t.toStateId, symbols: new Set() };
        edgeMap.set(pairKey, entry);
      }
      entry.symbols.add(t.symbol);
    }

    const edges: AutomataEdge[] = [];
    let edgeIndex = 0;
    for (const entry of edgeMap.values()) {
      edges.push({
        id: `e_min_${edgeIndex.toString()}`,
        source: entry.source,
        target: entry.target,
        symbols: Array.from(entry.symbols),
      });
      edgeIndex++;
    }

    return { nodes, edges };
  },

  /**
   * Finds all states reachable from the initial state via transitions.
   */
  getReachableStates(dfa: DFAData): {
    reachable: State[];
    unreachable: string[];
  } {
    let initial: State | undefined;
    for (const state of dfa.states.values()) {
      if (state.isInitial) {
        initial = state;
        break;
      }
    }

    if (!initial) {
      return { reachable: [], unreachable: Array.from(dfa.states.keys()) };
    }

    // Build adjacency list
    const adj = new Map<string, Set<string>>();
    for (const stateId of dfa.states.keys()) {
      adj.set(stateId, new Set());
    }
    for (const t of dfa.transitions) {
      adj.get(t.fromStateId)?.add(t.toStateId);
    }

    // BFS
    const visited = new Set<string>([initial.id]);
    const queue: string[] = [initial.id];

    while (queue.length > 0) {
      const curr = queue.shift();
      if (!curr) continue;
      const neighbors = adj.get(curr);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
    }

    const reachable: State[] = [];
    const unreachable: string[] = [];

    for (const [id, state] of dfa.states) {
      if (visited.has(id)) {
        reachable.push(state);
      } else {
        unreachable.push(id);
      }
    }

    return { reachable, unreachable };
  },

  /**
   * Computes the full Distinguishable Pairs table for all reachable states.
   */
  getDistinguishableTable(
    dfa: DFAData,
  ): Map<string, Map<string, boolean>> {
    const { reachable } = this.getReachableStates(dfa);
    const reachableIds = reachable.map((s) => s.id);

    // Fast transition lookup: from -> symbol -> to
    const delta = new Map<string, Map<string, string>>();
    for (const s of reachable) {
      delta.set(s.id, new Map());
    }
    for (const t of dfa.transitions) {
      if (delta.has(t.fromStateId)) {
        delta.get(t.fromStateId)?.set(t.symbol, t.toStateId);
      }
    }

    const stateMap = new Map(reachable.map((s) => [s.id, s]));
    const distinguishable = new Set<string>();

    // Step 1: Base step - pairs where one is accepting and one is not
    for (let i = 0; i < reachableIds.length; i++) {
      for (let j = i + 1; j < reachableIds.length; j++) {
        const idA = reachableIds[i];
        const idB = reachableIds[j];
        if (!idA || !idB) continue;
        const stateA = stateMap.get(idA);
        const stateB = stateMap.get(idB);
        if (!stateA || !stateB) continue;

        if (stateA.isAccepting !== stateB.isAccepting) {
          distinguishable.add(this.makePairKey(idA, idB));
        }
      }
    }

    // Step 2: Iterative propagation
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < reachableIds.length; i++) {
        for (let j = i + 1; j < reachableIds.length; j++) {
          const idA = reachableIds[i];
          const idB = reachableIds[j];
          if (!idA || !idB) continue;
          const pairKey = this.makePairKey(idA, idB);
          if (distinguishable.has(pairKey)) continue;

          for (const symbol of dfa.alphabet) {
            const nextA = delta.get(idA)?.get(symbol);
            const nextB = delta.get(idB)?.get(symbol);

            if (nextA !== nextB) {
              if (nextA !== undefined && nextB !== undefined) {
                const nextPairKey = this.makePairKey(nextA, nextB);
                if (distinguishable.has(nextPairKey)) {
                  distinguishable.add(pairKey);
                  changed = true;
                  break;
                }
              } else {
                // One defined, one undefined
                distinguishable.add(pairKey);
                changed = true;
                break;
              }
            }
          }
        }
      }
    }

    // Format as 2D map
    const table = new Map<string, Map<string, boolean>>();
    for (const idA of reachableIds) {
      const row = new Map<string, boolean>();
      for (const idB of reachableIds) {
        if (idA === idB) {
          row.set(idB, false);
        } else {
          row.set(idB, distinguishable.has(this.makePairKey(idA, idB)));
        }
      }
      table.set(idA, row);
    }

    return table;
  },

  /**
   * Minimizes a DFA using the table-filling / partition refinement algorithm.
   */
  minimize(dfa: DFAData): MinimizationResult {
    const { reachable, unreachable } = this.getReachableStates(dfa);
    if (reachable.length === 0) {
      throw new Error('DFA minimization failed: no reachable states.');
    }

    const table = this.getDistinguishableTable(dfa);
    const reachableIds = reachable.map((s) => s.id);

    const distinguishablePairs = new Set<string>();
    for (let i = 0; i < reachableIds.length; i++) {
      for (let j = i + 1; j < reachableIds.length; j++) {
        const idA = reachableIds[i];
        const idB = reachableIds[j];
        if (!idA || !idB) continue;
        if (table.get(idA)?.get(idB) === true) {
          distinguishablePairs.add(this.makePairKey(idA, idB));
        }
      }
    }

    // Partition refinement history tracking:
    // Initial partition: Non-accepting vs Accepting
    const nonAccepting = new Set<string>();
    const accepting = new Set<string>();
    for (const s of reachable) {
      if (s.isAccepting) {
        accepting.add(s.id);
      } else {
        nonAccepting.add(s.id);
      }
    }

    const initialPartition: Set<string>[] = [];
    if (nonAccepting.size > 0) initialPartition.push(nonAccepting);
    if (accepting.size > 0) initialPartition.push(accepting);

    // Group into final equivalence classes
    const partitions: Set<string>[] = [];
    for (const stateId of reachableIds) {
      let placed = false;
      for (const part of partitions) {
        // Pick an existing representative from part
        const rep = Array.from(part)[0];
        if (rep && table.get(stateId)?.get(rep) === false) {
          part.add(stateId);
          placed = true;
          break;
        }
      }
      if (!placed) {
        partitions.push(new Set([stateId]));
      }
    }

    const partitionSteps: Set<string>[][] = [initialPartition, partitions];

    // Build the minimal DFA
    const stateMap = new Map(reachable.map((s) => [s.id, s]));
    const minimalStates: State[] = [];
    const partitionOf = new Map<string, string>(); // stateId -> minimalStateId

    let partitionIndex = 0;
    for (const part of partitions) {
      const memberIds = Array.from(part).sort();
      const minId = `q_min_${partitionIndex.toString()}`;
      partitionIndex++;

      const isInitial = memberIds.some((id) => stateMap.get(id)?.isInitial);
      const isAccepting = memberIds.some((id) => stateMap.get(id)?.isAccepting);
      const name = `{${memberIds.join(',')}}`;

      for (const id of memberIds) {
        partitionOf.set(id, minId);
      }

      minimalStates.push({
        id: minId,
        name,
        isInitial,
        isAccepting,
      });
    }

    const minimalDFA = new DFA(minimalStates, dfa.alphabet);

    // Add transitions for the minimal DFA
    const addedTransitions = new Set<string>();
    for (const part of partitions) {
      const rep = Array.from(part)[0];
      if (!rep) continue;
      const fromMinId = partitionOf.get(rep);
      if (!fromMinId) continue;

      for (const t of dfa.transitions) {
        if (t.fromStateId === rep) {
          const toMinId = partitionOf.get(t.toStateId);
          if (toMinId) {
            const key = `${fromMinId}-${t.symbol}-${toMinId}`;
            if (!addedTransitions.has(key)) {
              minimalDFA.addTransition(fromMinId, toMinId, t.symbol);
              addedTransitions.add(key);
            }
          }
        }
      }
    }

    return {
      unreachableStates: unreachable,
      distinguishablePairs,
      partitions,
      partitionSteps,
      minimalDFA,
    };
  },
};
