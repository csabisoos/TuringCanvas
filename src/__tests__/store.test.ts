import { describe, it, expect, beforeEach } from 'vitest';
import { useAutomataStore } from '../store/useAutomataStore';

// Access the raw store API directly (no React hooks needed).
// Zustand exposes getState/setState on the hook itself.
const getState = (): ReturnType<typeof useAutomataStore.getState> => useAutomataStore.getState();

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

  // ─── serialize ────────────────────────────────────────────────────────────

  describe('serialize', () => {
    it('should return an empty-state JSON string when the store is empty', () => {
      const json = getState().serialize();
      const parsed = JSON.parse(json) as unknown;

      expect(parsed).toEqual({ nodes: [], edges: [] });
    });

    it('should serialize nodes correctly', () => {
      getState().addNode({ id: 'q0', position: { x: 10, y: 20 }, label: 'q0', isInitial: true, isAccepting: false });

      const parsed = JSON.parse(getState().serialize()) as { nodes: unknown[]; edges: unknown[] };

      expect(parsed.nodes).toHaveLength(1);
      expect(parsed.nodes[0]).toEqual({
        id: 'q0',
        position: { x: 10, y: 20 },
        label: 'q0',
        isInitial: true,
        isAccepting: false,
      });
    });

    it('should serialize edges correctly', () => {
      getState().addNode({ id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: true, isAccepting: false });
      getState().addNode({ id: 'q1', position: { x: 200, y: 0 }, label: 'q1', isInitial: false, isAccepting: true });
      getState().addEdge({ id: 'e0', source: 'q0', target: 'q1', symbols: ['a', 'b'] });

      const parsed = JSON.parse(getState().serialize()) as { nodes: unknown[]; edges: unknown[] };

      expect(parsed.edges).toHaveLength(1);
      expect(parsed.edges[0]).toEqual({ id: 'e0', source: 'q0', target: 'q1', symbols: ['a', 'b'] });
    });

    it('should produce a round-trippable string (serialize → deserialize → serialize)', () => {
      getState().addNode({ id: 'q0', position: { x: 5, y: 5 }, label: 'Start', isInitial: true, isAccepting: false });
      getState().addEdge({ id: 'e0', source: 'q0', target: 'q0', symbols: ['ε'] });

      const firstPass = getState().serialize();
      getState().deserialize(firstPass);
      const secondPass = getState().serialize();

      expect(secondPass).toBe(firstPass);
    });
  });

  // ─── deserialize ──────────────────────────────────────────────────────────

  describe('deserialize', () => {
    it('should overwrite the store with nodes and edges from valid JSON', () => {
      // Seed some existing data to confirm it is replaced, not merged.
      getState().addNode({ id: 'stale', position: { x: 0, y: 0 }, label: 'stale', isInitial: false, isAccepting: false });

      const payload = JSON.stringify({
        nodes: [{ id: 'q0', position: { x: 1, y: 2 }, label: 'q0', isInitial: true, isAccepting: false }],
        edges: [{ id: 'e0', source: 'q0', target: 'q0', symbols: ['0'] }],
      });

      getState().deserialize(payload);

      const { nodes, edges } = getState();
      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe('q0');
      expect(edges).toHaveLength(1);
      expect(edges[0].id).toBe('e0');
    });

    it('should restore an empty graph from an empty-state payload', () => {
      getState().addNode({ id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: true, isAccepting: false });

      getState().deserialize(JSON.stringify({ nodes: [], edges: [] }));

      expect(getState().nodes).toEqual([]);
      expect(getState().edges).toEqual([]);
    });

    // ── Error handling ────────────────────────────────────────────────────

    it('should throw on invalid JSON and leave the store unmodified', () => {
      getState().addNode({ id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: true, isAccepting: false });

      expect(() => { getState().deserialize('not json {'); }).toThrow();

      // Store must remain intact.
      expect(getState().nodes).toHaveLength(1);
      expect(getState().nodes[0].id).toBe('q0');
    });

    it('should throw when the payload is missing the "nodes" key', () => {
      expect(() => { getState().deserialize(JSON.stringify({ edges: [] })); }).toThrow();
      expect(getState().nodes).toEqual([]);
    });

    it('should throw when the payload is missing the "edges" key', () => {
      expect(() => { getState().deserialize(JSON.stringify({ nodes: [] })); }).toThrow();
      expect(getState().nodes).toEqual([]);
    });

    it('should throw when "nodes" is not an array', () => {
      expect(() => { getState().deserialize(JSON.stringify({ nodes: 'bad', edges: [] })); },
      ).toThrow();
    });

    it('should throw when "edges" is not an array', () => {
      expect(() => { getState().deserialize(JSON.stringify({ nodes: [], edges: 42 })); },
      ).toThrow();
    });
  });
});
