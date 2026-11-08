import { describe, it, expect } from 'vitest';
import { validateAutomaton } from '../core/validation';
import { completeDFA } from '../core/trapStateGenerator';
import type { AutomataNode, AutomataEdge } from '../types/ui';

describe('Automaton Validation & Trap State Completion', () => {
  const completeDfaNodes: AutomataNode[] = [
    { id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: true, isAccepting: false },
    { id: 'q1', position: { x: 100, y: 0 }, label: 'q1', isInitial: false, isAccepting: true },
  ];

  const completeDfaEdges: AutomataEdge[] = [
    { id: 'e0', source: 'q0', target: 'q1', symbols: ['a'] },
    { id: 'e1', source: 'q0', target: 'q0', symbols: ['b'] },
    { id: 'e2', source: 'q1', target: 'q1', symbols: ['a'] },
    { id: 'e3', source: 'q1', target: 'q0', symbols: ['b'] },
  ];

  describe('validateAutomaton', () => {
    it('validates a complete DFA correctly', () => {
      const result = validateAutomaton(completeDfaNodes, completeDfaEdges);
      expect(result.isDFA).toBe(true);
      expect(result.hasInitialState).toBe(true);
      expect(result.initialStateCount).toBe(1);
      expect(result.missingTransitions).toHaveLength(0);
      expect(result.nonDeterministicTransitions).toHaveLength(0);
      expect(result.epsilonTransitionsCount).toBe(0);
      expect(result.unreachableStateIds).toHaveLength(0);
    });

    it('identifies missing transitions in an incomplete DFA', () => {
      // Omit e3 (q1 -b-> q0)
      const edges = completeDfaEdges.slice(0, 3);
      const result = validateAutomaton(completeDfaNodes, edges);
      expect(result.isDFA).toBe(false);
      expect(result.missingTransitions).toHaveLength(1);
      expect(result.missingTransitions[0]).toEqual({ fromStateId: 'q1', symbol: 'b' });
    });

    it('detects nondeterministic transitions on the same symbol', () => {
      const edges: AutomataEdge[] = [
        ...completeDfaEdges,
        { id: 'e_extra', source: 'q0', target: 'q1', symbols: ['b'] }, // second 'b' from q0
      ];
      const result = validateAutomaton(completeDfaNodes, edges);
      expect(result.isDFA).toBe(false);
      expect(result.nonDeterministicTransitions).toHaveLength(1);
      expect(result.nonDeterministicTransitions[0].fromStateId).toBe('q0');
      expect(result.nonDeterministicTransitions[0].symbol).toBe('b');
      expect(result.nonDeterministicTransitions[0].targetStateIds).toContain('q0');
      expect(result.nonDeterministicTransitions[0].targetStateIds).toContain('q1');
    });

    it('detects epsilon transitions', () => {
      const edges: AutomataEdge[] = [
        { id: 'e0', source: 'q0', target: 'q1', symbols: ['ε'] },
      ];
      const result = validateAutomaton(completeDfaNodes, edges);
      expect(result.isDFA).toBe(false);
      expect(result.epsilonTransitionsCount).toBe(1);
    });

    it('identifies unreachable states', () => {
      const nodes: AutomataNode[] = [
        ...completeDfaNodes,
        { id: 'q_orphan', position: { x: 200, y: 100 }, label: 'q_orphan', isInitial: false, isAccepting: false },
      ];
      const result = validateAutomaton(nodes, completeDfaEdges);
      expect(result.unreachableStateIds).toContain('q_orphan');
    });
  });

  describe('completeDFA (Trap state generator)', () => {
    it('adds a trap state and routes all missing transitions to it', () => {
      // Incomplete DFA: q0 has 'a' to q1, has 'b' to q0. q1 has self-loop on 'a', no 'b'.
      // Alphabet = {a, b}
      const incompleteNodes: AutomataNode[] = [
        { id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: true, isAccepting: false },
        { id: 'q1', position: { x: 100, y: 0 }, label: 'q1', isInitial: false, isAccepting: true },
      ];
      // alphabet {a, b}
      const incompleteEdges: AutomataEdge[] = [
        { id: 'e0', source: 'q0', target: 'q1', symbols: ['a'] },
        { id: 'e1', source: 'q0', target: 'q0', symbols: ['b'] },
        { id: 'e2', source: 'q1', target: 'q1', symbols: ['a'] },
        // q1 missing 'b'
      ];

      const completed = completeDFA(incompleteNodes, incompleteEdges);
      expect(completed.nodes.length).toBe(3); // q0, q1, and q_trap
      const trap = completed.nodes.find((n) => n.id.includes('trap'));
      expect(trap).toBeDefined();
      expect(trap?.isAccepting).toBe(false);
      expect(trap?.isInitial).toBe(false);

      // Now run validateAutomaton on completed graph
      const validation = validateAutomaton(completed.nodes, completed.edges);
      expect(validation.isDFA).toBe(true);
      expect(validation.missingTransitions).toHaveLength(0);
    });

    it('returns identical graph if DFA is already complete', () => {
      const completed = completeDFA(completeDfaNodes, completeDfaEdges);
      expect(completed.nodes).toHaveLength(completeDfaNodes.length);
      expect(completed.edges).toHaveLength(completeDfaEdges.length);
    });
  });
});
