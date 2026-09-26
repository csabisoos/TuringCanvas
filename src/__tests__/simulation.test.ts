/**
 * Tests for the simulation adapter and the store's simulation actions.
 *
 * Coverage:
 *  - buildAndSimulate (pure adapter) — DFA acceptance, NFA branching, ε-closures,
 *    error cases.
 *  - useAutomataStore.startSimulation / stepForward / resetSimulation — state
 *    transitions, step-index advancement, accepted flag, error surface.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { buildAndSimulate } from '../store/simulationAdapter';
import { useAutomataStore } from '../store/useAutomataStore';
import type { AutomataNode, AutomataEdge } from '../types/ui';

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** A simple DFA that accepts strings over {a, b} that end in 'a'. */
function makeEndsInA(): { nodes: AutomataNode[]; edges: AutomataEdge[] } {
  const nodes: AutomataNode[] = [
    { id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: true,  isAccepting: false },
    { id: 'q1', position: { x: 1, y: 0 }, label: 'q1', isInitial: false, isAccepting: true  },
  ];
  const edges: AutomataEdge[] = [
    { id: 'e0', source: 'q0', target: 'q1', symbols: ['a'] },
    { id: 'e1', source: 'q0', target: 'q0', symbols: ['b'] },
    { id: 'e2', source: 'q1', target: 'q0', symbols: ['b'] },
    { id: 'e3', source: 'q1', target: 'q1', symbols: ['a'] },
  ];
  return { nodes, edges };
}

/** A two-state NFA that accepts 'a' or 'aa' (nondeterministic split). */
function makeNFAaOrAA(): { nodes: AutomataNode[]; edges: AutomataEdge[] } {
  const nodes: AutomataNode[] = [
    { id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: true,  isAccepting: false },
    { id: 'q1', position: { x: 1, y: 0 }, label: 'q1', isInitial: false, isAccepting: false },
    { id: 'q2', position: { x: 2, y: 0 }, label: 'q2', isInitial: false, isAccepting: true  },
  ];
  const edges: AutomataEdge[] = [
    // q0 --a--> q2   (accept on single 'a')
    { id: 'e0', source: 'q0', target: 'q2', symbols: ['a'] },
    // q0 --a--> q1   (nondeterministic branch)
    { id: 'e1', source: 'q0', target: 'q1', symbols: ['a'] },
    // q1 --a--> q2   (accept on 'aa')
    { id: 'e2', source: 'q1', target: 'q2', symbols: ['a'] },
  ];
  return { nodes, edges };
}

/** Minimal graph for ε-transition tests. */
function makeEpsilonGraph(): { nodes: AutomataNode[]; edges: AutomataEdge[] } {
  const nodes: AutomataNode[] = [
    { id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: true,  isAccepting: false },
    { id: 'q1', position: { x: 1, y: 0 }, label: 'q1', isInitial: false, isAccepting: false },
    { id: 'q2', position: { x: 2, y: 0 }, label: 'q2', isInitial: false, isAccepting: true  },
  ];
  const edges: AutomataEdge[] = [
    { id: 'e0', source: 'q0', target: 'q1', symbols: ['ε'] }, // epsilon
    { id: 'e1', source: 'q1', target: 'q2', symbols: ['a'] },
  ];
  return { nodes, edges };
}

// ── Store helpers ─────────────────────────────────────────────────────────────

const getState = () => useAutomataStore.getState();

function seedStore(nodes: AutomataNode[], edges: AutomataEdge[]): void {
  getState().clearStore();
  for (const n of nodes) getState().addNode(n);
  for (const e of edges) getState().addEdge(e);
}

// ── buildAndSimulate (pure adapter) ──────────────────────────────────────────

describe('buildAndSimulate', () => {
  describe('DFA-shaped graphs', () => {
    it('accepts input that satisfies the DFA language', () => {
      const { nodes, edges } = makeEndsInA();
      const result = buildAndSimulate(nodes, edges, 'ba');
      expect('kind' in result).toBe(false);
      if (!('kind' in result)) expect(result.accepted).toBe(true);
    });

    it('rejects input that does not satisfy the DFA language', () => {
      const { nodes, edges } = makeEndsInA();
      const result = buildAndSimulate(nodes, edges, 'ab');
      expect('kind' in result).toBe(false);
      if (!('kind' in result)) expect(result.accepted).toBe(false);
    });

    it('produces the correct number of steps (one per symbol)', () => {
      const { nodes, edges } = makeEndsInA();
      const result = buildAndSimulate(nodes, edges, 'bba');
      if ('kind' in result) throw new Error('Expected success');
      // steps.length === input.length
      expect(result.steps).toHaveLength(3);
    });

    it('initialStep contains the initial state id', () => {
      const { nodes, edges } = makeEndsInA();
      const result = buildAndSimulate(nodes, edges, 'a');
      if ('kind' in result) throw new Error('Expected success');
      expect(result.initialStep.has('q0')).toBe(true);
    });

    it('accepts the empty string when the initial state is accepting', () => {
      const nodes: AutomataNode[] = [
        { id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: true, isAccepting: true },
      ];
      const edges: AutomataEdge[] = [];
      const result = buildAndSimulate(nodes, edges, '');
      if ('kind' in result) throw new Error('Expected success');
      expect(result.accepted).toBe(true);
    });

    it('rejects the empty string when the initial state is not accepting', () => {
      const { nodes, edges } = makeEndsInA();
      const result = buildAndSimulate(nodes, edges, '');
      if ('kind' in result) throw new Error('Expected success');
      expect(result.accepted).toBe(false);
    });
  });

  describe('NFA-shaped graphs', () => {
    it('accepts strings where any nondeterministic branch succeeds', () => {
      const { nodes, edges } = makeNFAaOrAA();
      const r1 = buildAndSimulate(nodes, edges, 'a');
      const r2 = buildAndSimulate(nodes, edges, 'aa');
      if ('kind' in r1 || 'kind' in r2) throw new Error('Expected success');
      expect(r1.accepted).toBe(true);
      expect(r2.accepted).toBe(true);
    });

    it('rejects strings not in the NFA language', () => {
      const { nodes, edges } = makeNFAaOrAA();
      const result = buildAndSimulate(nodes, edges, 'aaa');
      if ('kind' in result) throw new Error('Expected success');
      expect(result.accepted).toBe(false);
    });

    it('captures multi-state sets when branches are alive in parallel', () => {
      const { nodes, edges } = makeNFAaOrAA();
      const result = buildAndSimulate(nodes, edges, 'aa');
      if ('kind' in result) throw new Error('Expected success');
      // After first 'a': both q1 and q2 should be active (nondeterministic split)
      expect(result.steps[0].has('q2')).toBe(true);
      expect(result.steps[0].has('q1')).toBe(true);
    });
  });

  describe('ε-transitions', () => {
    it('expands initial ε-closure before the first symbol', () => {
      const { nodes, edges } = makeEpsilonGraph();
      const result = buildAndSimulate(nodes, edges, 'a');
      if ('kind' in result) throw new Error('Expected success');
      // q0 -ε-> q1, so initial closure should include q0 and q1
      expect(result.initialStep.has('q0')).toBe(true);
      expect(result.initialStep.has('q1')).toBe(true);
    });

    it('accepts via ε-path: q0 -ε-> q1 -a-> q2 (accepting)', () => {
      const { nodes, edges } = makeEpsilonGraph();
      const result = buildAndSimulate(nodes, edges, 'a');
      if ('kind' in result) throw new Error('Expected success');
      expect(result.accepted).toBe(true);
    });
  });

  describe('error cases', () => {
    it('returns NO_INITIAL_STATE when no node is marked initial', () => {
      const nodes: AutomataNode[] = [
        { id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: false, isAccepting: false },
      ];
      const result = buildAndSimulate(nodes, [], 'a');
      expect('kind' in result && result.kind).toBe('NO_INITIAL_STATE');
    });

    it('returns NO_INITIAL_STATE when more than one node is marked initial', () => {
      const nodes: AutomataNode[] = [
        { id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: true, isAccepting: false },
        { id: 'q1', position: { x: 1, y: 0 }, label: 'q1', isInitial: true, isAccepting: false },
      ];
      const result = buildAndSimulate(nodes, [], 'a');
      expect('kind' in result && result.kind).toBe('NO_INITIAL_STATE');
    });

    it('produces an empty active set (dead config) for unknown input symbols', () => {
      const { nodes, edges } = makeEndsInA(); // alphabet = {a, b}
      const result = buildAndSimulate(nodes, edges, 'c'); // 'c' not in alphabet
      if ('kind' in result) throw new Error('Expected success path');
      expect(result.steps[0].size).toBe(0);
      expect(result.accepted).toBe(false);
    });
  });
});

// ── Store simulation actions ──────────────────────────────────────────────────

describe('useAutomataStore — simulation actions', () => {
  beforeEach(() => {
    const { nodes, edges } = makeEndsInA();
    seedStore(nodes, edges);
  });

  describe('startSimulation', () => {
    it('initialises step index to 0 and sets activeNodeIds to the initial closure', () => {
      getState().startSimulation('ba');
      const { currentStepIndex, activeNodeIds } = getState();
      expect(currentStepIndex).toBe(0);
      expect(activeNodeIds.has('q0')).toBe(true);
    });

    it('populates simulationSteps with length = input.length + 1 (initial + per-symbol)', () => {
      getState().startSimulation('ba');
      expect(getState().simulationSteps).toHaveLength(3); // step0 + 'b' + 'a'
    });

    it('sets simulationError when graph has no initial state', () => {
      getState().clearStore();
      getState().addNode({ id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: false, isAccepting: false });
      getState().startSimulation('a');
      expect(getState().simulationError).toBeTruthy();
      expect(getState().currentStepIndex).toBe(-1);
    });

    it('clears a previous run before starting a new one', () => {
      getState().startSimulation('a');
      getState().startSimulation('ba');
      expect(getState().simulationSteps).toHaveLength(3);
    });

    it('sets simulationAccepted immediately for empty input', () => {
      getState().startSimulation('');
      // q0 is not accepting in makeEndsInA, so empty string is rejected
      expect(getState().simulationAccepted).toBe(false);
    });
  });

  describe('stepForward', () => {
    it('increments currentStepIndex on each call', () => {
      getState().startSimulation('ba'); // 2 symbols → steps 0,1,2
      getState().stepForward();
      expect(getState().currentStepIndex).toBe(1);
      getState().stepForward();
      expect(getState().currentStepIndex).toBe(2);
    });

    it('updates activeNodeIds to the set for the new step', () => {
      getState().startSimulation('a'); // q0 -a-> q1 (accepting)
      getState().stepForward();
      expect(getState().activeNodeIds.has('q1')).toBe(true);
      expect(getState().activeNodeIds.has('q0')).toBe(false);
    });

    it('sets simulationAccepted to true on the last step of an accepted string', () => {
      getState().startSimulation('a');
      getState().stepForward(); // last step
      expect(getState().simulationAccepted).toBe(true);
    });

    it('sets simulationAccepted to false on the last step of a rejected string', () => {
      getState().startSimulation('b'); // q0 -b-> q0 (not accepting)
      getState().stepForward();
      expect(getState().simulationAccepted).toBe(false);
    });

    it('is a no-op when called before startSimulation', () => {
      getState().resetSimulation();
      getState().stepForward();
      expect(getState().currentStepIndex).toBe(-1);
    });

    it('is a no-op once simulationAccepted has been set (simulation finished)', () => {
      getState().startSimulation('a');
      getState().stepForward(); // finishes
      const stepBefore = getState().currentStepIndex;
      getState().stepForward(); // should no-op
      expect(getState().currentStepIndex).toBe(stepBefore);
    });
  });

  describe('resetSimulation', () => {
    it('clears activeNodeIds, steps, stepIndex, and accepted flag', () => {
      getState().startSimulation('a');
      getState().resetSimulation();

      const { activeNodeIds, simulationSteps, currentStepIndex, simulationAccepted, simulationError } = getState();
      expect(activeNodeIds.size).toBe(0);
      expect(simulationSteps).toHaveLength(0);
      expect(currentStepIndex).toBe(-1);
      expect(simulationAccepted).toBeNull();
      expect(simulationError).toBeNull();
    });

    it('is idempotent', () => {
      getState().resetSimulation();
      getState().resetSimulation();
      expect(getState().currentStepIndex).toBe(-1);
    });
  });
});
