import { describe, it, expect, beforeEach } from 'vitest';
import { useAutomataStore } from '../store/useAutomataStore';

const getState = (): ReturnType<typeof useAutomataStore.getState> => useAutomataStore.getState();

describe('Undo / Redo History Stack', () => {
  beforeEach(() => {
    getState().clearStore();
  });

  it('initialises with empty past and future stacks', () => {
    expect(getState().past).toHaveLength(0);
    expect(getState().future).toHaveLength(0);
    expect(getState().canUndo()).toBe(false);
    expect(getState().canRedo()).toBe(false);
  });

  it('records history when adding a node and undos correctly', () => {
    getState().addNode({ id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: true, isAccepting: false });
    expect(getState().nodes).toHaveLength(1);
    expect(getState().canUndo()).toBe(true);
    expect(getState().canRedo()).toBe(false);

    getState().undo();
    expect(getState().nodes).toHaveLength(0);
    expect(getState().canUndo()).toBe(false);
    expect(getState().canRedo()).toBe(true);

    getState().redo();
    expect(getState().nodes).toHaveLength(1);
    expect(getState().nodes[0].id).toBe('q0');
    expect(getState().canUndo()).toBe(true);
    expect(getState().canRedo()).toBe(false);
  });

  it('supports sequential undos and redos across multiple graph edits', () => {
    // 1. Add q0
    getState().addNode({ id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: true, isAccepting: false });
    // 2. Add q1
    getState().addNode({ id: 'q1', position: { x: 100, y: 0 }, label: 'q1', isInitial: false, isAccepting: true });
    // 3. Add edge e0
    getState().addEdge({ id: 'e0', source: 'q0', target: 'q1', symbols: ['a'] });

    expect(getState().nodes).toHaveLength(2);
    expect(getState().edges).toHaveLength(1);

    // Undo 3: edge removed
    getState().undo();
    expect(getState().edges).toHaveLength(0);
    expect(getState().nodes).toHaveLength(2);

    // Undo 2: q1 removed
    getState().undo();
    expect(getState().nodes).toHaveLength(1);
    expect(getState().nodes[0].id).toBe('q0');

    // Undo 1: q0 removed
    getState().undo();
    expect(getState().nodes).toHaveLength(0);
    expect(getState().canUndo()).toBe(false);

    // Redo 1 & 2
    getState().redo();
    expect(getState().nodes).toHaveLength(1);
    getState().redo();
    expect(getState().nodes).toHaveLength(2);
    getState().redo();
    expect(getState().edges).toHaveLength(1);
  });

  it('clears future stack when a new mutation occurs after undo', () => {
    getState().addNode({ id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: true, isAccepting: false });
    getState().addNode({ id: 'q1', position: { x: 100, y: 0 }, label: 'q1', isInitial: false, isAccepting: false });
    getState().undo(); // nodes = [q0], future has [q0, q1]
    expect(getState().canRedo()).toBe(true);

    // New action
    getState().addNode({ id: 'q2', position: { x: 200, y: 0 }, label: 'q2', isInitial: false, isAccepting: true });
    expect(getState().canRedo()).toBe(false);
    expect(getState().future).toHaveLength(0);
    expect(getState().nodes.map((n) => n.id)).toEqual(['q0', 'q2']);
  });

  it('caps history stack at 50 entries', () => {
    for (let i = 0; i < 60; i++) {
      getState().addNode({
        id: `q${i.toString()}`,
        position: { x: i * 10, y: 0 },
        label: `q${i.toString()}`,
        isInitial: false,
        isAccepting: false,
      });
    }
    expect(getState().past.length).toBeLessThanOrEqual(50);
  });
});
