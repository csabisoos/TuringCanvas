import { describe, it, expect } from 'vitest';
import { automatonToGNFA } from '../core/GNFA';
import { simplifyRegex, unionRegex, concatRegex, starRegex } from '../core/regexFormatter';
import type { AutomataNode, AutomataEdge } from '../types/ui';

describe('regexFormatter', () => {
  it('handles basic union simplifications', () => {
    expect(unionRegex('∅', 'a')).toBe('a');
    expect(unionRegex('a', '∅')).toBe('a');
    expect(unionRegex('a', 'a')).toBe('a');
    expect(unionRegex('a', 'b')).toBe('a+b');
  });

  it('handles basic concat simplifications', () => {
    expect(concatRegex('∅', 'a')).toBe('∅');
    expect(concatRegex('a', '∅')).toBe('∅');
    expect(concatRegex('ε', 'a')).toBe('a');
    expect(concatRegex('a', 'ε')).toBe('a');
    expect(concatRegex('a', 'b')).toBe('ab');
  });

  it('handles star simplifications', () => {
    expect(starRegex('∅')).toBe('ε');
    expect(starRegex('ε')).toBe('ε');
    expect(starRegex('a')).toBe('a*');
    expect(starRegex('a*')).toBe('a*');
    expect(starRegex('a+b')).toBe('(a+b)*');
  });

  it('simplifies complex expressions', () => {
    expect(simplifyRegex('εa')).toBe('a');
  });
});

describe('GNFA State Elimination (Task 2.3)', () => {
  it('converts a simple 2-state automaton to regex "a"', () => {
    // q0 -a-> q1 (accept)
    const nodes: AutomataNode[] = [
      { id: 'q0', label: 'q0', position: { x: 0, y: 0 }, isInitial: true, isAccepting: false },
      { id: 'q1', label: 'q1', position: { x: 100, y: 0 }, isInitial: false, isAccepting: true },
    ];
    const edges: AutomataEdge[] = [
      { id: 'e1', source: 'q0', target: 'q1', symbols: ['a'] },
    ];

    const gnfa = automatonToGNFA(nodes, edges);
    expect(gnfa.getRemainingIntermediateStates().sort()).toEqual(['q0', 'q1'].sort());

    gnfa.eliminateState('q0');
    expect(gnfa.getRemainingIntermediateStates()).toEqual(['q1']);

    gnfa.eliminateState('q1');
    expect(gnfa.getRemainingIntermediateStates()).toEqual([]);

    expect(gnfa.getFinalRegex()).toBe('a');
  });

  it('converts a single self-loop state to regex "a*"', () => {
    // q0 (init, accept) -a-> q0
    const nodes: AutomataNode[] = [
      { id: 'q0', label: 'q0', position: { x: 0, y: 0 }, isInitial: true, isAccepting: true },
    ];
    const edges: AutomataEdge[] = [
      { id: 'e1', source: 'q0', target: 'q0', symbols: ['a'] },
    ];

    const gnfa = automatonToGNFA(nodes, edges);
    gnfa.eliminateState('q0');
    expect(gnfa.getFinalRegex()).toBe('a*');
  });

  it('converts a cyclic 2-state automaton to regex "(ab)*"', () => {
    // q0 (init, accept) -a-> q1, q1 -b-> q0
    const nodes: AutomataNode[] = [
      { id: 'q0', label: 'q0', position: { x: 0, y: 0 }, isInitial: true, isAccepting: true },
      { id: 'q1', label: 'q1', position: { x: 100, y: 0 }, isInitial: false, isAccepting: false },
    ];
    const edges: AutomataEdge[] = [
      { id: 'e1', source: 'q0', target: 'q1', symbols: ['a'] },
      { id: 'e2', source: 'q1', target: 'q0', symbols: ['b'] },
    ];

    const gnfa = automatonToGNFA(nodes, edges);
    gnfa.eliminateState('q1');
    gnfa.eliminateState('q0');
    expect(gnfa.getFinalRegex()).toBe('(ab)*');
  });

  it('eliminates all states automatically with eliminateAll()', () => {
    const nodes: AutomataNode[] = [
      { id: 'q0', label: 'q0', position: { x: 0, y: 0 }, isInitial: true, isAccepting: false },
      { id: 'q1', label: 'q1', position: { x: 100, y: 0 }, isInitial: false, isAccepting: true },
    ];
    const edges: AutomataEdge[] = [
      { id: 'e1', source: 'q0', target: 'q1', symbols: ['0'] },
    ];

    const gnfa = automatonToGNFA(nodes, edges);
    gnfa.eliminateAll();
    expect(gnfa.getRemainingIntermediateStates()).toHaveLength(0);
    expect(gnfa.getFinalRegex()).toBe('0');
  });
});
