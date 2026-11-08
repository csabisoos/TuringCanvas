import { describe, it, expect, beforeEach } from 'vitest';
import { useAutomataStore } from '../store/useAutomataStore';

describe('Canvas Annotations & Sticky Notes (Task 10.3)', () => {
  beforeEach(() => {
    useAutomataStore.getState().clearStore();
  });

  it('adds an annotation note to the canvas', () => {
    const { addAnnotation } = useAutomataStore.getState();
    addAnnotation({ x: 150, y: 200 }, 'Invariant: q0 is even', 'yellow');

    const state = useAutomataStore.getState();
    expect(state.annotations).toHaveLength(1);
    expect(state.annotations[0]?.text).toBe('Invariant: q0 is even');
    expect(state.annotations[0]?.color).toBe('yellow');
    expect(state.annotations[0]?.position).toEqual({ x: 150, y: 200 });
  });

  it('updates annotation text and color', () => {
    const { addAnnotation, updateAnnotation } = useAutomataStore.getState();
    addAnnotation({ x: 0, y: 0 }, 'Initial Note', 'blue');

    const id = useAutomataStore.getState().annotations[0]?.id;
    if (!id) throw new Error('Annotation ID missing');

    updateAnnotation(id, { text: 'Updated Note', color: 'green' });

    const updated = useAutomataStore.getState().annotations.find((a) => a.id === id);
    expect(updated?.text).toBe('Updated Note');
    expect(updated?.color).toBe('green');
  });

  it('deletes an annotation note', () => {
    const { addAnnotation, deleteAnnotation } = useAutomataStore.getState();
    addAnnotation({ x: 0, y: 0 }, 'To delete');

    const id = useAutomataStore.getState().annotations[0]?.id;
    if (!id) throw new Error('Annotation ID missing');

    deleteAnnotation(id);
    expect(useAutomataStore.getState().annotations).toHaveLength(0);
  });

  it('preserves annotations across serialization and deserialization', () => {
    const { addAnnotation, serialize, deserialize } = useAutomataStore.getState();
    addAnnotation({ x: 50, y: 80 }, 'Persistent Note', 'purple');

    const json = serialize();
    deserialize(json);

    const reloaded = useAutomataStore.getState().annotations;
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0]?.text).toBe('Persistent Note');
    expect(reloaded[0]?.color).toBe('purple');
  });
});
