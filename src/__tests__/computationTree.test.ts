import { describe, it, expect } from 'vitest';
import { buildComputationTree } from '../core/computationTreeBuilder';
import type { AutomataNode, AutomataEdge } from '../types/ui';
import { EPSILON } from '../types/automata';

describe('Nondeterministic Computation Tree Builder', () => {
  it('builds a single deterministic branch tree to acceptance', () => {
    const nodes: AutomataNode[] = [
      { id: 'q0', label: 'q0', isInitial: true, isAccepting: false, position: { x: 0, y: 0 } },
      { id: 'q1', label: 'q1', isInitial: false, isAccepting: true, position: { x: 100, y: 0 } },
    ];
    const edges: AutomataEdge[] = [
      { id: 'e1', source: 'q0', target: 'q1', symbols: ['a'] },
    ];

    const root = buildComputationTree(nodes, edges, 'a');
    expect(root).toBeDefined();
    expect(root?.stateId).toBe('q0');
    expect(root?.remainingInput).toBe('a');
    expect(root?.children).toHaveLength(1);

    const child = root?.children[0];
    expect(child?.stateId).toBe('q1');
    expect(child?.remainingInput).toBe('');
    expect(child?.status).toBe('accept');
  });

  it('builds branching paths with acceptance and rejection', () => {
    // q0 on 'a' goes to q1 (dead-end, non-final) AND q2 (final)
    const nodes: AutomataNode[] = [
      { id: 'q0', label: 'q0', isInitial: true, isAccepting: false, position: { x: 0, y: 0 } },
      { id: 'q1', label: 'q1', isInitial: false, isAccepting: false, position: { x: 100, y: 0 } },
      { id: 'q2', label: 'q2', isInitial: false, isAccepting: true, position: { x: 100, y: 100 } },
    ];
    const edges: AutomataEdge[] = [
      { id: 'e1', source: 'q0', target: 'q1', symbols: ['a'] },
      { id: 'e2', source: 'q0', target: 'q2', symbols: ['a'] },
    ];

    const root = buildComputationTree(nodes, edges, 'a');
    expect(root?.children).toHaveLength(2);

    const q1Child = root?.children.find((c) => c.stateId === 'q1');
    const q2Child = root?.children.find((c) => c.stateId === 'q2');

    expect(q1Child?.status).toBe('reject');
    expect(q2Child?.status).toBe('accept');
  });

  it('handles epsilon transitions without consuming input', () => {
    const nodes: AutomataNode[] = [
      { id: 'q0', label: 'q0', isInitial: true, isAccepting: false, position: { x: 0, y: 0 } },
      { id: 'q1', label: 'q1', isInitial: false, isAccepting: true, position: { x: 100, y: 0 } },
    ];
    const edges: AutomataEdge[] = [
      { id: 'e1', source: 'q0', target: 'q1', symbols: [EPSILON] },
    ];

    const root = buildComputationTree(nodes, edges, '');
    expect(root?.children).toHaveLength(1);
    expect(root?.children[0]?.stateId).toBe('q1');
    expect(root?.children[0]?.status).toBe('accept');
  });

  it('safely handles epsilon-loops without infinite recursion', () => {
    const nodes: AutomataNode[] = [
      { id: 'q0', label: 'q0', isInitial: true, isAccepting: false, position: { x: 0, y: 0 } },
      { id: 'q1', label: 'q1', isInitial: false, isAccepting: false, position: { x: 100, y: 0 } },
    ];
    const edges: AutomataEdge[] = [
      { id: 'e1', source: 'q0', target: 'q1', symbols: [EPSILON] },
      { id: 'e2', source: 'q1', target: 'q0', symbols: [EPSILON] },
    ];

    // Must not throw stack overflow
    const root = buildComputationTree(nodes, edges, 'a');
    expect(root).toBeDefined();
  });
});
