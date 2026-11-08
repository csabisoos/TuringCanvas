import { describe, it, expect } from 'vitest';
import {
  initPowersetStep,
  expandNextStep,
  completePowerset,
  powersetToVisualGraph,
} from '../core/powersetStepEngine';
import type { AutomataNode, AutomataEdge } from '../types/ui';

describe('Interactive Powerset Construction Engine', () => {
  // Simple NFA: q0 --a--> q0, q0 --a--> q1 (q1 is accepting)
  // Alphabet: {a}
  const nfaNodes: AutomataNode[] = [
    { id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: true, isAccepting: false },
    { id: 'q1', position: { x: 100, y: 0 }, label: 'q1', isInitial: false, isAccepting: true },
  ];
  const nfaEdges: AutomataEdge[] = [
    { id: 'e0', source: 'q0', target: 'q0', symbols: ['a'] },
    { id: 'e1', source: 'q0', target: 'q1', symbols: ['a'] },
  ];

  it('initializes step state with initial closure and unexpanded subset', () => {
    const stepState = initPowersetStep(nfaNodes, nfaEdges);
    expect(stepState.initialKey).toBe('q0');
    expect(stepState.unexpandedSubsets).toEqual(['q0']);
    expect(stepState.discoveredSubsets.has('q0')).toBe(true);
    expect(stepState.isComplete).toBe(false);
    expect(stepState.transitions).toHaveLength(0);
  });

  it('expands one subset at a time discovering target subsets and transitions', () => {
    const s0 = initPowersetStep(nfaNodes, nfaEdges);
    expect(s0.unexpandedSubsets).toHaveLength(1);

    // Expand q0 on 'a' -> should discover 'q0|q1'
    const s1 = expandNextStep(s0, nfaNodes, nfaEdges);
    expect(s1.discoveredSubsets.has('q0|q1')).toBe(true);
    expect(s1.unexpandedSubsets).toContain('q0|q1');
    expect(s1.transitions).toContainEqual({ fromKey: 'q0', symbol: 'a', toKey: 'q0|q1' });
    expect(s1.isComplete).toBe(false);

    // Expand q0|q1 on 'a' -> {q0, q1} on 'a' goes to {q0, q1}
    const s2 = expandNextStep(s1, nfaNodes, nfaEdges);
    expect(s2.transitions).toContainEqual({ fromKey: 'q0|q1', symbol: 'a', toKey: 'q0|q1' });
    expect(s2.isComplete).toBe(true);
  });

  it('completePowerset runs all steps to completion', () => {
    const s0 = initPowersetStep(nfaNodes, nfaEdges);
    const completed = completePowerset(s0, nfaNodes, nfaEdges);
    expect(completed.isComplete).toBe(true);
    expect(completed.unexpandedSubsets).toHaveLength(0);
    expect(completed.discoveredSubsets.size).toBe(2); // q0 and q0|q1
    expect(completed.acceptingKeys.has('q0|q1')).toBe(true);
  });

  it('converts powerset step state to clean visual graph', () => {
    const s0 = initPowersetStep(nfaNodes, nfaEdges);
    const completed = completePowerset(s0, nfaNodes, nfaEdges);
    const graph = powersetToVisualGraph(completed);

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(2);

    const initNode = graph.nodes.find((n) => n.isInitial);
    expect(initNode).toBeDefined();
    expect(initNode?.id).toBe('q0');

    const acceptNode = graph.nodes.find((n) => n.isAccepting);
    expect(acceptNode).toBeDefined();
    expect(acceptNode?.id).toBe('q0|q1');
  });

  it('handles NFA with epsilon transitions correctly', () => {
    const epsNodes: AutomataNode[] = [
      { id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: true, isAccepting: false },
      { id: 'q1', position: { x: 100, y: 0 }, label: 'q1', isInitial: false, isAccepting: true },
    ];
    const epsEdges: AutomataEdge[] = [
      { id: 'e0', source: 'q0', target: 'q1', symbols: ['ε'] },
    ];

    const s0 = initPowersetStep(epsNodes, epsEdges);
    // Initial closure of q0 with ε to q1 is {q0, q1}
    expect(s0.initialKey).toBe('q0|q1');
    expect(s0.acceptingKeys.has('q0|q1')).toBe(true);
  });
});
