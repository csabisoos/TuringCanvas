import { describe, it, expect, beforeEach } from 'vitest';
import { useAutomataStore } from '../store/useAutomataStore';
import type { AutomataNode, AutomataEdge } from '../types/ui';

function makeEndsInA(): { nodes: AutomataNode[]; edges: AutomataEdge[] } {
  const nodes: AutomataNode[] = [
    { id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: true, isAccepting: false },
    { id: 'q1', position: { x: 1, y: 0 }, label: 'q1', isInitial: false, isAccepting: true },
  ];
  const edges: AutomataEdge[] = [
    { id: 'e0', source: 'q0', target: 'q1', symbols: ['a'] },
    { id: 'e1', source: 'q0', target: 'q0', symbols: ['b'] },
    { id: 'e2', source: 'q1', target: 'q0', symbols: ['b'] },
    { id: 'e3', source: 'q1', target: 'q1', symbols: ['a'] },
  ];
  return { nodes, edges };
}

const getState = (): ReturnType<typeof useAutomataStore.getState> => useAutomataStore.getState();

describe('Batch Testing (Multiple Run)', () => {
  beforeEach(() => {
    getState().clearStore();
    getState().clearTestCases();
  });

  it('adds, updates, and removes test cases', () => {
    getState().addTestCase('ba', 'accept');
    expect(getState().testCases).toHaveLength(1);
    const tc = getState().testCases[0];
    expect(tc.input).toBe('ba');
    expect(tc.expected).toBe('accept');

    getState().updateTestCase(tc.id, { input: 'bba', expected: 'reject' });
    expect(getState().testCases[0].input).toBe('bba');
    expect(getState().testCases[0].expected).toBe('reject');

    getState().removeTestCase(tc.id);
    expect(getState().testCases).toHaveLength(0);
  });

  it('runs all test cases against a DFA and computes pass/fail accurately', () => {
    const { nodes, edges } = makeEndsInA();
    for (const n of nodes) getState().addNode(n);
    for (const e of edges) getState().addEdge(e);

    getState().addTestCase('ba', 'accept'); // should pass
    getState().addTestCase('b', 'reject');   // should pass
    getState().addTestCase('ab', 'accept');  // should fail (ab ends in b, rejects)
    getState().addTestCase('a');             // no expected -> actual is accept, passed is true

    getState().runAllTestCases();

    const cases = getState().testCases;
    expect(cases[0].actual).toBe('accept');
    expect(cases[0].passed).toBe(true);

    expect(cases[1].actual).toBe('reject');
    expect(cases[1].passed).toBe(true);

    expect(cases[2].actual).toBe('reject');
    expect(cases[2].passed).toBe(false);

    expect(cases[3].actual).toBe('accept');
    expect(cases[3].passed).toBe(true);
  });

  it('marks actual as error when the automaton is invalid', () => {
    getState().addNode({ id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: false, isAccepting: true });
    getState().addTestCase('a', 'accept');

    getState().runAllTestCases();

    const tc = getState().testCases[0];
    expect(tc.actual).toBe('error');
    expect(tc.passed).toBe(false);
    expect(tc.errorMessage).toBeTruthy();
  });
});
