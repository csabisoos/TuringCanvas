import type { AutomataNode, AutomataEdge } from '../types/ui';
import { EPSILON } from '../types/automata';

export interface AutomatonValidationResult {
  isDFA: boolean;
  hasInitialState: boolean;
  initialStateCount: number;
  unreachableStateIds: string[];
  missingTransitions: { fromStateId: string; symbol: string }[];
  nonDeterministicTransitions: { fromStateId: string; symbol: string; targetStateIds: string[] }[];
  epsilonTransitionsCount: number;
}

export function validateAutomaton(
  nodes: AutomataNode[],
  edges: AutomataEdge[],
): AutomatonValidationResult {
  const initialNodes = nodes.filter((n) => n.isInitial);
  const initialStateCount = initialNodes.length;
  const hasInitialState = initialStateCount === 1;

  // Infer alphabet from edges (excluding ε)
  const alphabet = new Set<string>();
  let epsilonTransitionsCount = 0;

  for (const edge of edges) {
    for (const sym of edge.symbols) {
      if (sym === 'ε' || sym === EPSILON) {
        epsilonTransitionsCount++;
      } else {
        alphabet.add(sym);
      }
    }
  }

  // Transitions map: fromStateId -> symbol -> Set of targetStateIds
  const transitionMap = new Map<string, Map<string, Set<string>>>();
  for (const node of nodes) {
    transitionMap.set(node.id, new Map());
  }

  for (const edge of edges) {
    const fromMap = transitionMap.get(edge.source);
    if (!fromMap) continue;
    for (const sym of edge.symbols) {
      if (sym === 'ε' || sym === EPSILON) continue;
      let targets = fromMap.get(sym);
      if (!targets) {
        targets = new Set();
        fromMap.set(sym, targets);
      }
      targets.add(edge.target);
    }
  }

  const missingTransitions: { fromStateId: string; symbol: string }[] = [];
  const nonDeterministicTransitions: { fromStateId: string; symbol: string; targetStateIds: string[] }[] = [];

  // Check determinism and completeness across all nodes and alphabet symbols
  if (alphabet.size > 0 && nodes.length > 0) {
    for (const node of nodes) {
      const fromMap = transitionMap.get(node.id);
      for (const sym of alphabet) {
        const targets = fromMap?.get(sym);
        if (!targets || targets.size === 0) {
          missingTransitions.push({ fromStateId: node.id, symbol: sym });
        } else if (targets.size > 1) {
          nonDeterministicTransitions.push({
            fromStateId: node.id,
            symbol: sym,
            targetStateIds: Array.from(targets),
          });
        }
      }
    }
  }

  // Reachability analysis from initial state
  const reachable = new Set<string>();
  if (hasInitialState && initialNodes[0]) {
    const queue: string[] = [initialNodes[0].id];
    reachable.add(initialNodes[0].id);

    while (queue.length > 0) {
      const curr = queue.shift();
      if (!curr) break;
      for (const edge of edges) {
        if (edge.source === curr && !reachable.has(edge.target)) {
          reachable.add(edge.target);
          queue.push(edge.target);
        }
      }
    }
  }

  const unreachableStateIds = nodes
    .filter((n) => !reachable.has(n.id))
    .map((n) => n.id);

  const isDFA =
    hasInitialState &&
    epsilonTransitionsCount === 0 &&
    missingTransitions.length === 0 &&
    nonDeterministicTransitions.length === 0;

  return {
    isDFA,
    hasInitialState,
    initialStateCount,
    unreachableStateIds,
    missingTransitions,
    nonDeterministicTransitions,
    epsilonTransitionsCount,
  };
}
