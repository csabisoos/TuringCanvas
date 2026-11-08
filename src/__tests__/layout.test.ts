import { describe, it, expect } from 'vitest';
import {
  applyCircularLayout,
  applyHierarchicalLayout,
  applyForceLayout,
  autoLayout,
} from '../core/layout/graphLayout';
import type { AutomataNode, AutomataEdge } from '../types/ui';

describe('Graph Auto-Layout Algorithms', () => {
  const sampleNodes: AutomataNode[] = [
    { id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: true, isAccepting: false },
    { id: 'q1', position: { x: 0, y: 0 }, label: 'q1', isInitial: false, isAccepting: false },
    { id: 'q2', position: { x: 0, y: 0 }, label: 'q2', isInitial: false, isAccepting: true },
  ];

  const sampleEdges: AutomataEdge[] = [
    { id: 'e0', source: 'q0', target: 'q1', symbols: ['a'] },
    { id: 'e1', source: 'q1', target: 'q2', symbols: ['b'] },
  ];

  describe('applyCircularLayout', () => {
    it('arranges nodes in distinct positions around a circle', () => {
      const positioned = applyCircularLayout(sampleNodes);
      expect(positioned).toHaveLength(3);

      // Verify no two nodes share the exact same position
      const posKeys = new Set(positioned.map((n) => `${n.position.x.toFixed(1)},${n.position.y.toFixed(1)}`));
      expect(posKeys.size).toBe(3);
    });

    it('handles empty or single node gracefully', () => {
      expect(applyCircularLayout([])).toEqual([]);
      const single = applyCircularLayout([sampleNodes[0]]);
      expect(single).toHaveLength(1);
    });
  });

  describe('applyHierarchicalLayout', () => {
    it('positions start state before successor states along the X axis', () => {
      const positioned = applyHierarchicalLayout(sampleNodes, sampleEdges);
      const q0 = positioned.find((n) => n.id === 'q0');
      const q1 = positioned.find((n) => n.id === 'q1');
      const q2 = positioned.find((n) => n.id === 'q2');

      expect(q0).toBeDefined();
      expect(q1).toBeDefined();
      expect(q2).toBeDefined();

      if (q0 && q1 && q2) {
        expect(q0.position.x).toBeLessThan(q1.position.x);
        expect(q1.position.x).toBeLessThan(q2.position.x);
      }
    });
  });

  describe('applyForceLayout', () => {
    it('disentangles overlapping nodes via spring forces', () => {
      const overlapping: AutomataNode[] = [
        { id: 'q0', position: { x: 100, y: 100 }, label: 'q0', isInitial: true, isAccepting: false },
        { id: 'q1', position: { x: 100, y: 100 }, label: 'q1', isInitial: false, isAccepting: false },
        { id: 'q2', position: { x: 100, y: 100 }, label: 'q2', isInitial: false, isAccepting: true },
      ];
      const positioned = applyForceLayout(overlapping, sampleEdges, 30);
      expect(positioned).toHaveLength(3);

      const posKeys = new Set(positioned.map((n) => `${n.position.x.toFixed(0)},${n.position.y.toFixed(0)}`));
      expect(posKeys.size).toBe(3);
    });
  });

  describe('autoLayout unified dispatcher', () => {
    it('delegates to selected algorithm correctly', () => {
      const circ = autoLayout(sampleNodes, sampleEdges, 'circular');
      expect(circ).toHaveLength(3);
      const hier = autoLayout(sampleNodes, sampleEdges, 'hierarchical');
      expect(hier).toHaveLength(3);
      const force = autoLayout(sampleNodes, sampleEdges, 'force');
      expect(force).toHaveLength(3);
    });
  });
});
