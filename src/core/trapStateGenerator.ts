import type { AutomataNode, AutomataEdge } from '../types/ui';
import { validateAutomaton } from './validation';
import { EPSILON } from '../types/automata';

export function completeDFA(
  nodes: AutomataNode[],
  edges: AutomataEdge[],
): { nodes: AutomataNode[]; edges: AutomataEdge[] } {
  const validation = validateAutomaton(nodes, edges);
  if (validation.missingTransitions.length === 0) {
    return { nodes, edges };
  }

  // Collect alphabet from non-ε edges
  const alphabetSet = new Set<string>();
  for (const edge of edges) {
    for (const sym of edge.symbols) {
      if (sym !== 'ε' && sym !== EPSILON) {
        alphabetSet.add(sym);
      }
    }
  }
  const alphabet = Array.from(alphabetSet);
  if (alphabet.length === 0) {
    return { nodes, edges };
  }

  // Find or create trap state
  let trapNode = nodes.find((n) => n.id === 'q_trap' || n.label === 'trap');
  const updatedNodes = [...nodes];

  if (!trapNode) {
    let maxX = 0;
    let maxY = 0;
    for (const n of nodes) {
      if (n.position.x > maxX) maxX = n.position.x;
      if (n.position.y > maxY) maxY = n.position.y;
    }

    trapNode = {
      id: 'q_trap',
      position: { x: maxX + 180, y: maxY + 40 },
      label: 'trap',
      isInitial: false,
      isAccepting: false,
    };
    updatedNodes.push(trapNode);
  }

  const updatedEdges = [...edges];

  // Self-loop on trap node for all alphabet symbols
  const trapSelfLoop = updatedEdges.find(
    (e) => e.source === trapNode.id && e.target === trapNode.id,
  );
  if (trapSelfLoop) {
    const existing = new Set(trapSelfLoop.symbols);
    for (const sym of alphabet) existing.add(sym);
    trapSelfLoop.symbols = Array.from(existing);
  } else {
    updatedEdges.push({
      id: `e_${trapNode.id}_loop`,
      source: trapNode.id,
      target: trapNode.id,
      symbols: [...alphabet],
    });
  }

  // Group missing transitions by source state
  const missingBySource = new Map<string, Set<string>>();
  for (const m of validation.missingTransitions) {
    // If the trap node itself was already present and had missing transitions,
    // the self loop above covers it.
    if (m.fromStateId === trapNode.id) continue;
    let set = missingBySource.get(m.fromStateId);
    if (!set) {
      set = new Set();
      missingBySource.set(m.fromStateId, set);
    }
    set.add(m.symbol);
  }

  for (const [fromId, syms] of missingBySource.entries()) {
    const existingEdgeToTrap = updatedEdges.find(
      (e) => e.source === fromId && e.target === trapNode.id,
    );
    if (existingEdgeToTrap) {
      const merged = new Set(existingEdgeToTrap.symbols);
      for (const sym of syms) merged.add(sym);
      existingEdgeToTrap.symbols = Array.from(merged);
    } else {
      updatedEdges.push({
        id: `e_${fromId}_to_${trapNode.id}`,
        source: fromId,
        target: trapNode.id,
        symbols: Array.from(syms),
      });
    }
  }

  return { nodes: updatedNodes, edges: updatedEdges };
}
