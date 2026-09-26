import { create } from 'zustand';
import type { AutomataNode, AutomataEdge } from '../types/ui';

interface AutomataState {
  nodes: AutomataNode[];
  edges: AutomataEdge[];
}

interface AutomataActions {
  addNode: (node: AutomataNode) => void;
  addEdge: (edge: AutomataEdge) => void;
  clearStore: () => void;
}

type AutomataStore = AutomataState & AutomataActions;

const INITIAL_STATE: AutomataState = {
  nodes: [],
  edges: [],
};

export const useAutomataStore = create<AutomataStore>()((set) => ({
  ...INITIAL_STATE,

  addNode: (node) =>
    set((state) => ({ nodes: [...state.nodes, node] })),

  addEdge: (edge) =>
    set((state) => ({ edges: [...state.edges, edge] })),

  clearStore: () => set(INITIAL_STATE),
}));
