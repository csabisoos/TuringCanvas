/**
 * Visual representation of a single automaton state on the canvas.
 * Decoupled from the core mathematical types in src/types/automata.ts.
 */
export interface AutomataNode {
  id: string;
  position: { x: number; y: number };
  label: string;
  isInitial: boolean;
  isAccepting: boolean;
}

/**
 * Visual representation of a transition (edge) between two nodes on the canvas.
 */
export interface AutomataEdge {
  id: string;
  source: string; // AutomataNode id
  target: string; // AutomataNode id
  symbols: string[];
}
