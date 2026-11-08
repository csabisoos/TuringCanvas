import type { AutomataNode, AutomataEdge } from '../types/ui';
import { NFA } from './NFA';
import { EPSILON } from '../types/automata';
import type { State } from '../types/automata';
import { applyCircularLayout } from './layout/graphLayout';

export interface PowersetStepState {
  alphabet: string[];
  discoveredSubsets: Map<string, Set<string>>;
  unexpandedSubsets: string[];
  transitions: { fromKey: string; symbol: string; toKey: string }[];
  initialKey: string;
  acceptingKeys: Set<string>;
  isComplete: boolean;
}

export function setKey(s: Set<string>): string {
  return [...s].sort().join('|') || '∅';
}

function buildCoreNFA(
  nodes: AutomataNode[],
  edges: AutomataEdge[],
): { nfa: NFA; alphabet: string[] } {
  const initialNodes = nodes.filter((n) => n.isInitial);
  if (initialNodes.length !== 1) {
    throw new Error('Graph must have exactly one initial state for powerset construction.');
  }

  const alphabetSet = new Set<string>();
  for (const edge of edges) {
    for (const sym of edge.symbols) {
      const norm = sym === 'ε' ? EPSILON : sym;
      if (norm !== EPSILON) {
        alphabetSet.add(norm);
      }
    }
  }

  // If alphabet is empty, provide a fallback dummy so NFA constructor doesn't throw
  if (alphabetSet.size === 0) {
    alphabetSet.add('a');
  }

  const alphabet = Array.from(alphabetSet);

  const coreStates: State[] = nodes.map((n) => ({
    id: n.id,
    name: n.label || n.id,
    isInitial: n.isInitial,
    isAccepting: n.isAccepting,
  }));

  const nfa = new NFA(coreStates, new Set(alphabet));

  for (const edge of edges) {
    for (const sym of edge.symbols) {
      const norm = sym === 'ε' ? EPSILON : sym;
      nfa.addTransition(edge.source, edge.target, norm);
    }
  }

  return { nfa, alphabet };
}

function move(nfa: NFA, currentStates: Set<string>, symbol: string): Set<string> {
  const result = new Set<string>();
  for (const t of nfa.data.transitions) {
    if (t.symbol === symbol && currentStates.has(t.fromStateId)) {
      result.add(t.toStateId);
    }
  }
  return result;
}

export function initPowersetStep(
  nodes: AutomataNode[],
  edges: AutomataEdge[],
): PowersetStepState {
  const { nfa, alphabet } = buildCoreNFA(nodes, edges);

  const initialNode = nodes.find((n) => n.isInitial);
  if (!initialNode) {
    throw new Error('Graph must have an initial state for powerset construction.');
  }
  const startSubset = nfa.getEpsilonClosure(new Set([initialNode.id]));
  const startKey = setKey(startSubset);

  const discoveredSubsets = new Map<string, Set<string>>();
  discoveredSubsets.set(startKey, startSubset);

  const acceptingKeys = new Set<string>();
  for (const id of startSubset) {
    const n = nodes.find((node) => node.id === id);
    if (n?.isAccepting) {
      acceptingKeys.add(startKey);
      break;
    }
  }

  return {
    alphabet,
    discoveredSubsets,
    unexpandedSubsets: [startKey],
    transitions: [],
    initialKey: startKey,
    acceptingKeys,
    isComplete: false,
  };
}

export function expandNextStep(
  state: PowersetStepState,
  nodes: AutomataNode[],
  edges: AutomataEdge[],
): PowersetStepState {
  if (state.unexpandedSubsets.length === 0) {
    return { ...state, isComplete: true };
  }

  const { nfa, alphabet } = buildCoreNFA(nodes, edges);

  const [currentKey, ...remainingUnexpanded] = state.unexpandedSubsets;
  const currentSubset = state.discoveredSubsets.get(currentKey);
  if (!currentSubset) {
    return { ...state, unexpandedSubsets: remainingUnexpanded, isComplete: remainingUnexpanded.length === 0 };
  }

  const newDiscovered = new Map(state.discoveredSubsets);
  const newAccepting = new Set(state.acceptingKeys);
  const newTransitions = [...state.transitions];
  const newUnexpanded = [...remainingUnexpanded];

  for (const symbol of alphabet) {
    const moved = move(nfa, currentSubset, symbol);
    const nextSubset = nfa.getEpsilonClosure(moved);
    const nextKey = setKey(nextSubset);

    newTransitions.push({
      fromKey: currentKey,
      symbol,
      toKey: nextKey,
    });

    if (!newDiscovered.has(nextKey)) {
      newDiscovered.set(nextKey, nextSubset);
      newUnexpanded.push(nextKey);

      for (const id of nextSubset) {
        const n = nodes.find((node) => node.id === id);
        if (n?.isAccepting) {
          newAccepting.add(nextKey);
          break;
        }
      }
    }
  }

  return {
    ...state,
    discoveredSubsets: newDiscovered,
    unexpandedSubsets: newUnexpanded,
    transitions: newTransitions,
    acceptingKeys: newAccepting,
    isComplete: newUnexpanded.length === 0,
  };
}

export function completePowerset(
  state: PowersetStepState,
  nodes: AutomataNode[],
  edges: AutomataEdge[],
): PowersetStepState {
  let curr = state;
  let iterations = 0;
  // Safety guard against infinite loops in unusual graphs
  while (!curr.isComplete && iterations < 100) {
    curr = expandNextStep(curr, nodes, edges);
    iterations++;
  }
  return curr;
}

export function powersetToVisualGraph(state: PowersetStepState): {
  nodes: AutomataNode[];
  edges: AutomataEdge[];
} {
  const rawNodes: AutomataNode[] = [];

  for (const key of state.discoveredSubsets.keys()) {
    const label = key === '∅' ? '∅' : `{${key.split('|').join(',')}}`;
    rawNodes.push({
      id: key,
      position: { x: 0, y: 0 },
      label,
      isInitial: key === state.initialKey,
      isAccepting: state.acceptingKeys.has(key),
    });
  }

  // Layout the macro-state nodes neatly around a circle
  const nodes = applyCircularLayout(rawNodes);

  // Group transitions by from -> to
  const edgeMap = new Map<string, { source: string; target: string; symbols: Set<string> }>();
  for (const t of state.transitions) {
    const pairKey = `${t.fromKey}->${t.toKey}`;
    let entry = edgeMap.get(pairKey);
    if (!entry) {
      entry = { source: t.fromKey, target: t.toKey, symbols: new Set() };
      edgeMap.set(pairKey, entry);
    }
    entry.symbols.add(t.symbol);
  }

  const edges: AutomataEdge[] = [];
  let edgeId = 0;
  for (const entry of edgeMap.values()) {
    edges.push({
      id: `e_dfa_${edgeId.toString()}`,
      source: entry.source,
      target: entry.target,
      symbols: Array.from(entry.symbols),
    });
    edgeId++;
  }

  return { nodes, edges };
}
