import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { NodeChange, EdgeChange, Connection } from '@xyflow/react';
import type { AutomataNode, AutomataEdge } from '../types/ui';

// ── Serialized payload shape ──────────────────────────────────────────────────

interface SerializedGraph {
  nodes: AutomataNode[];
  edges: AutomataEdge[];
}

// ── Store types ───────────────────────────────────────────────────────────────

type EditorMode = 'edit' | 'simulate';

interface AutomataState {
  nodes: AutomataNode[];
  edges: AutomataEdge[];
  editorMode: EditorMode;
}

interface AutomataActions {
  addNode: (node: AutomataNode) => void;
  addEdge: (edge: AutomataEdge) => void;
  clearStore: () => void;
  /** Switches the editor between 'edit' and 'simulate' modes. */
  setEditorMode: (mode: EditorMode) => void;
  /** Returns a JSON string of the current nodes and edges. */
  serialize: () => string;
  /**
   * Overwrites the store with the graph encoded in `json`.
   * Throws a `TypeError` if the string is not valid JSON or the payload
   * is structurally invalid (missing/wrong-typed `nodes` or `edges` keys).
   * The store is left **unmodified** when an error is thrown.
   */
  deserialize: (json: string) => void;
  /**
   * Handles React Flow node change events (drag, select, remove, etc.).
   * Delegates to `applyNodeChanges` and writes the result back to the store.
   */
  onNodesChange: (changes: NodeChange[]) => void;
  /**
   * Handles React Flow edge change events (select, remove, etc.).
   * Delegates to `applyEdgeChanges` and writes the result back to the store.
   */
  onEdgesChange: (changes: EdgeChange[]) => void;
  /**
   * Handles a new connection drawn between two handles.
   * Creates a new `AutomataEdge` with a default `ε` symbol.
   */
  onConnect: (connection: Connection) => void;
}

type AutomataStore = AutomataState & AutomataActions;

// ── Helpers ───────────────────────────────────────────────────────────────────

const INITIAL_STATE: AutomataState = {
  nodes: [],
  edges: [],
  editorMode: 'edit',
};

function parseAndValidate(json: string): SerializedGraph {
  // JSON.parse throws SyntaxError on malformed input — let it propagate.
  const raw: unknown = JSON.parse(json);

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new TypeError('Deserialization error: payload must be a JSON object.');
  }

  const obj = raw as Record<string, unknown>;

  if (!Array.isArray(obj['nodes'])) {
    throw new TypeError('Deserialization error: "nodes" must be an array.');
  }

  if (!Array.isArray(obj['edges'])) {
    throw new TypeError('Deserialization error: "edges" must be an array.');
  }

  return {
    nodes: obj['nodes'] as AutomataNode[],
    edges: obj['edges'] as AutomataEdge[],
  };
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAutomataStore = create<AutomataStore>()((set, get) => ({
  ...INITIAL_STATE,

  addNode: (node) =>
    set((state) => ({ nodes: [...state.nodes, node] })),

  addEdge: (edge) =>
    set((state) => ({ edges: [...state.edges, edge] })),

  clearStore: () => set(INITIAL_STATE),

  setEditorMode: (mode) => set({ editorMode: mode }),

  serialize: () => {
    const { nodes, edges } = get();
    return JSON.stringify({ nodes, edges });
  },

  deserialize: (json) => {
    // Validate BEFORE touching the store — guarantees atomicity on error.
    const { nodes, edges } = parseAndValidate(json);
    set({ nodes, edges });
  },

  onNodesChange: (changes) => {
    set((state) => {
      // Build a minimal RF-compatible Node array so applyNodeChanges can work.
      // We only need `id`, `position`, and `data` — RF adds the rest internally.
      const rfNodes = state.nodes.map((n) => ({
        id: n.id,
        position: n.position,
        data: {
          label: n.label,
          isInitial: n.isInitial,
          isAccepting: n.isAccepting,
        },
        type: 'stateNode',
      }));

      const updated = applyNodeChanges(changes, rfNodes);

      // Map back to AutomataNode, preserving domain fields.
      const next: AutomataNode[] = updated.map((n) => ({
        id: n.id,
        position: { x: n.position.x, y: n.position.y },
        label: (n.data as { label: string }).label,
        isInitial: (n.data as { isInitial: boolean }).isInitial,
        isAccepting: (n.data as { isAccepting: boolean }).isAccepting,
      }));
      return { nodes: next };
    });
  },

  onEdgesChange: (changes) => {
    set((state) => {
      // AutomataEdge is structurally compatible with RF's Edge minimum shape.
      const updated = applyEdgeChanges(
        changes,
        state.edges as Parameters<typeof applyEdgeChanges>[1],
      );
      // Map back: preserve the domain `symbols` field.
      const edgeMap = new Map(state.edges.map((e) => [e.id, e]));
      const next: AutomataEdge[] = updated.map((e) => {
        const original = edgeMap.get(e.id);
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          symbols: original?.symbols ?? [],
        };
      });
      return { edges: next };
    });
  },

  onConnect: (connection) => {
    const newEdge: AutomataEdge = {
      id: crypto.randomUUID(),
      source: connection.source,
      target: connection.target,
      symbols: ['ε'],
    };
    set((state) => ({ edges: [...state.edges, newEdge] }));
  },
}));
