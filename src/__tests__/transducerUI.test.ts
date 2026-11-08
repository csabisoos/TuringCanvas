import { describe, it, expect } from 'vitest';
import { buildMealyFromCanvas, buildMooreFromCanvas } from '../store/transducerAdapter';
import type { AutomataEdge, AutomataNode } from '../types/ui';

describe('Transducer Canvas Adapters', () => {
  it('builds MealyMachine from canvas nodes and edges with i/o labels', () => {
    const nodes: AutomataNode[] = [
      { id: 'q0', label: 'q0', position: { x: 0, y: 0 }, isInitial: true, isAccepting: false },
      { id: 'q1', label: 'q1', position: { x: 100, y: 0 }, isInitial: false, isAccepting: false },
    ];
    const edges: AutomataEdge[] = [
      { id: 'e1', source: 'q0', target: 'q1', symbols: ['0 / 1', '1 / 0'] },
      { id: 'e2', source: 'q1', target: 'q0', symbols: ['0 / 0', '1 / 1'] },
    ];

    const result = buildMealyFromCanvas(nodes, edges);
    expect(result.error).toBeUndefined();
    expect(result.mealy).toBeDefined();

    const sim = result.mealy ? result.mealy.simulate('01') : null;
    expect(sim?.output).toBe('11');
    expect(sim?.statePath).toEqual(['q0', 'q1', 'q0']);
  });

  it('builds MooreMachine from canvas nodes with mooreOutput and edges', () => {
    const nodes: AutomataNode[] = [
      { id: 'q0', label: 'q0', position: { x: 0, y: 0 }, isInitial: true, isAccepting: false, mooreOutput: 'A' },
      { id: 'q1', label: 'q1', position: { x: 100, y: 0 }, isInitial: false, isAccepting: false, mooreOutput: 'B' },
    ];
    const edges: AutomataEdge[] = [
      { id: 'e1', source: 'q0', target: 'q1', symbols: ['0'] },
      { id: 'e2', source: 'q1', target: 'q0', symbols: ['1'] },
    ];

    const result = buildMooreFromCanvas(nodes, edges);
    expect(result.error).toBeUndefined();
    expect(result.moore).toBeDefined();

    const sim = result.moore ? result.moore.simulate('010') : null;
    expect(sim?.output).toBe('ABAB');
    expect(sim?.statePath).toEqual(['q0', 'q1', 'q0', 'q1']);
  });

  it('reports error if no initial state exists', () => {
    const nodes: AutomataNode[] = [
      { id: 'q0', label: 'q0', position: { x: 0, y: 0 }, isInitial: false, isAccepting: false },
    ];
    const edges: AutomataEdge[] = [];

    const mealyRes = buildMealyFromCanvas(nodes, edges);
    expect(mealyRes.error).toMatch(/must have exactly one initial state/);

    const mooreRes = buildMooreFromCanvas(nodes, edges);
    expect(mooreRes.error).toMatch(/must have exactly one initial state/);
  });
});
