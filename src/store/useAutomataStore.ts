import { create } from 'zustand';
import type { AutomataNode, AutomataEdge } from '../types/ui';

// ── Serialized payload shape ──────────────────────────────────────────────────

interface SerializedGraph {
  nodes: AutomataNode[];
  edges: AutomataEdge[];
}

// ── Store types ───────────────────────────────────────────────────────────────

interface AutomataState {
  nodes: AutomataNode[];
  edges: AutomataEdge[];
}

interface AutomataActions {
  addNode: (node: AutomataNode) => void;
  addEdge: (edge: AutomataEdge) => void;
  clearStore: () => void;
  /** Returns a JSON string of the current nodes and edges. */
  serialize: () => string;
  /**
   * Overwrites the store with the graph encoded in `json`.
   * Throws a `TypeError` if the string is not valid JSON or the payload
   * is structurally invalid (missing/wrong-typed `nodes` or `edges` keys).
   * The store is left **unmodified** when an error is thrown.
   */
  deserialize: (json: string) => void;
}

type AutomataStore = AutomataState & AutomataActions;

// ── Helpers ───────────────────────────────────────────────────────────────────

const INITIAL_STATE: AutomataState = {
  nodes: [],
  edges: [],
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

  serialize: () => {
    const { nodes, edges } = get();
    return JSON.stringify({ nodes, edges });
  },

  deserialize: (json) => {
    // Validate BEFORE touching the store — guarantees atomicity on error.
    const { nodes, edges } = parseAndValidate(json);
    set({ nodes, edges });
  },
}));
