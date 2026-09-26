import { describe, it, expect, beforeEach } from 'vitest';
import { useAutomataStore } from '../store/useAutomataStore';

// Access the raw store API directly (no React hooks needed).
// Zustand exposes getState/setState on the hook itself.
const getState = () => useAutomataStore.getState();

describe('useAutomataStore', () => {
  beforeEach(() => {
    // Reset store to a clean slate before every test.
    getState().clearStore();
  });

  // ─── addNode ──────────────────────────────────────────────────────────────

  describe('addNode', () => {
    it('should start with an empty nodes array', () => {
      expect(getState().nodes).toEqual([]);
    });

    it('should add a single node to the store', () => {
      getState().addNode({
        id: 'q0',
        position: { x: 100, y: 200 },
        label: 'q0',
        isInitial: true,
        isAccepting: false,
      });

      const { nodes } = getState();
      expect(nodes).toHaveLength(1);
      expect(nodes[0]).toMatchObject({
        id: 'q0',
        label: 'q0',
        isInitial: true,
        isAccepting: false,
        position: { x: 100, y: 200 },
      });
    });

    it('should add multiple nodes independently', () => {
      getState().addNode({
        id: 'q0',
        position: { x: 0, y: 0 },
        label: 'q0',
        isInitial: true,
        isAccepting: false,
      });
      getState().addNode({
        id: 'q1',
        position: { x: 200, y: 0 },
        label: 'q1',
        isInitial: false,
        isAccepting: true,
      });

      const { nodes } = getState();
      expect(nodes).toHaveLength(2);
      expect(nodes[1].id).toBe('q1');
      expect(nodes[1].isAccepting).toBe(true);
    });
  });

  // ─── addEdge ──────────────────────────────────────────────────────────────

  describe('addEdge', () => {
    it('should start with an empty edges array', () => {
      expect(getState().edges).toEqual([]);
    });

    it('should add an edge between two existing nodes', () => {
      getState().addNode({ id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: true, isAccepting: false });
      getState().addNode({ id: 'q1', position: { x: 200, y: 0 }, label: 'q1', isInitial: false, isAccepting: true });

      getState().addEdge({ id: 'e0', source: 'q0', target: 'q1', symbols: ['a', 'b'] });

      const { edges } = getState();
      expect(edges).toHaveLength(1);
      expect(edges[0]).toMatchObject({
        id: 'e0',
        source: 'q0',
        target: 'q1',
        symbols: ['a', 'b'],
      });
    });

    it('should support self-loop edges', () => {
      getState().addNode({ id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: true, isAccepting: false });

      getState().addEdge({ id: 'e0', source: 'q0', target: 'q0', symbols: ['ε'] });

      expect(getState().edges[0].source).toBe('q0');
      expect(getState().edges[0].target).toBe('q0');
    });

    it('should accumulate multiple edges', () => {
      getState().addNode({ id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: true, isAccepting: false });
      getState().addNode({ id: 'q1', position: { x: 200, y: 0 }, label: 'q1', isInitial: false, isAccepting: true });

      getState().addEdge({ id: 'e0', source: 'q0', target: 'q1', symbols: ['a'] });
      getState().addEdge({ id: 'e1', source: 'q1', target: 'q0', symbols: ['b'] });

      expect(getState().edges).toHaveLength(2);
    });
  });

  // ─── clearStore ───────────────────────────────────────────────────────────

  describe('clearStore', () => {
    it('should remove all nodes and edges', () => {
      getState().addNode({ id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: true, isAccepting: false });
      getState().addEdge({ id: 'e0', source: 'q0', target: 'q0', symbols: ['a'] });

      getState().clearStore();

      expect(getState().nodes).toEqual([]);
      expect(getState().edges).toEqual([]);
    });

    it('should be idempotent when called on an already-empty store', () => {
      getState().clearStore();
      getState().clearStore();

      expect(getState().nodes).toEqual([]);
      expect(getState().edges).toEqual([]);
    });
  });
});
