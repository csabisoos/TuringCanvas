import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { NodeChange, EdgeChange, Connection } from '@xyflow/react';
import type { AutomataNode, AutomataEdge } from '../types/ui';
import type { MachineType } from '../types/machineTypes';
import { buildAndSimulate } from './simulationAdapter';

// ── Serialized payload shape ──────────────────────────────────────────────────

interface SerializedGraph {
  nodes: AutomataNode[];
  edges: AutomataEdge[];
}

// ── Store types ───────────────────────────────────────────────────────────────

export type ContentView = 'dashboard' | 'editor' | 'settings' | 'help';
export type MachineType =
  | 'fa'           // Finite Automaton (DFA/NFA)
  | 'pda'          // Pushdown Automaton
  | 'tm'           // Turing Machine
  | 'mtm'          // Multi-tape Turing Machine
  | 'mealy'        // Mealy Machine
  | 'moore'        // Moore Machine
  | 'grammar'      // Grammar (CFG)
  | 'l-system'     // L-System
  | 'regex'        // Regular Expression
  | 'cfg-pumping'  // Context-Free Pumping Lemma
  | 'reg-pumping'; // Regular Pumping Lemma

type EditorMode = 'edit' | 'simulate';
/**
 * 'select' — default canvas interaction (drag to move/select nodes, no new edges).
 * 'connect' — armed by the Sidebar "Add Transition" toggle; dragging from a
 * handle draws a new transition. Required so automata edges are only ever
 * created intentionally, never as a side effect of repositioning a state.
 */
type EditorTool = 'select' | 'connect';

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  autoSave: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  animationSpeed: number;
  defaultMachineType: MachineType | null;
  startupView: ContentView;
  fontSize: number;
  edgeCurvature: number;
  handleSize: number;
  debugMode: boolean;
  telemetry: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  autoSave: false,
  showGrid: true,
  snapToGrid: true,
  animationSpeed: 1.0,
  defaultMachineType: null,
  startupView: 'dashboard',
  fontSize: 13,
  edgeCurvature: 0.5,
  handleSize: 12,
  debugMode: false,
  telemetry: false,
};

interface AutomataState {
  nodes: AutomataNode[];
  edges: AutomataEdge[];
  editorMode: EditorMode;
  editorTool: EditorTool;

  // ── App navigation state ────────────────────────────────────────────────────
  contentView: ContentView;
  sidebarCollapsed: boolean;
  machineType: MachineType | null;

  // ── Selection state ───────────────────────────────────────────────────────
  /** IDs of nodes currently selected on the canvas. Kept in sync via useOnSelectionChange. */
  selectedNodeIds: string[];
  /** IDs of edges currently selected on the canvas. Kept in sync via useOnSelectionChange. */
  selectedEdgeIds: string[];

  // ── Simulation state ──────────────────────────────────────────────────────
  /** The set of node ids currently highlighted as "active" in the simulation. */
  activeNodeIds: Set<string>;
  /**
   * Pre-computed traversal: one Set<string> per input symbol consumed.
   * Index 0 is the initial ε-closure (before any symbol).
   * Index 1..n map to symbols[0..n-1].
   */
  simulationSteps: Set<string>[];
  /** Points into simulationSteps; -1 means "not started". */
  currentStepIndex: number;
  /** Human-readable error set by startSimulation when the graph is invalid. */
  simulationError: string | null;
  /** Set to true/false after the last step is reached; null while in-progress. */
  simulationAccepted: boolean | null;

  // ── Preferences ───────────────────────────────────────────────────────────
  preferences: UserPreferences;
}

interface AutomataActions {
  addNode: (node: AutomataNode) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  addEdge: (edge: AutomataEdge) => void;
  /**
   * Convenience action called by the Sidebar "Add Transition" button.
   * Creates an edge with a default `ε` symbol between `source` and `target`.
   */
  addTransition: (source: string, target: string) => void;
  updateEdgeSymbols: (edgeId: string, symbols: string[]) => void;
  /** Sets the node with `id` as the only initial state (clears others). */
  markInitial: (id: string) => void;
  /** Toggles the accepting status of the node with `id`. */
  markAccepting: (id: string) => void;
  /**
   * Syncs canvas selection state into the store.
   * Called by the `useOnSelectionChange` hook in AutomataCanvas.
   */
  setSelectedElements: (nodeIds: string[], edgeIds: string[]) => void;
  /** Removes all currently selected nodes and edges from the store, then clears selection. */
  deleteSelected: (nodeIds: string[], edgeIds: string[]) => void;
  clearStore: () => void;
  /** Switches the editor between 'edit' and 'simulate' modes. */
  setEditorMode: (mode: EditorMode) => void;
  /** Switches the canvas interaction tool between 'select' and 'connect'. */
  setEditorTool: (tool: EditorTool) => void;
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

  // ── Simulation actions ────────────────────────────────────────────────────
  /**
   * Builds an NFA from the current visual graph, computes the full step-by-step
   * traversal for `input`, and initialises simulation state at step 0
   * (the initial ε-closure, before any symbol is consumed).
   *
   * On success:  activeNodeIds = initial ε-closure, currentStepIndex = 0.
   * On failure:  simulationError is populated, no other state changes.
   */
  startSimulation: (input: string) => void;
  /**
   * Advances the simulation by one step (one input symbol).
   * No-ops if we are already past the last step.
   */
  stepForward: () => void;
  /**
   * Clears all simulation state back to the "not started" baseline.
   */
  resetSimulation: () => void;

  // ── Navigation actions ─────────────────────────────────────────────────────
  /** Sets the current content view (dashboard, editor, settings, help). */
  setContentView: (view: ContentView) => void;
  /** Toggles the sidebar collapsed state. */
  toggleSidebar: () => void;
  /** Sets the sidebar collapsed state explicitly. */
  setSidebarCollapsed: (collapsed: boolean) => void;
  /** Switches to the editor for the given machine type. */
  openEditor: (type: MachineType) => void;
  /** Returns to the dashboard; optionally clears the current workspace. */
  returnToDashboard: (clearWorkspace?: boolean) => void;
  /** @deprecated Use returnToDashboard instead. Kept for backward compatibility. */
  returnToMenu: (clearWorkspace?: boolean) => void;

  // ── Preferences actions ────────────────────────────────────────────────────
  /** Updates preferences partially (merged with existing). */
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  /** Resets preferences to defaults. */
  resetPreferences: () => void;

  // ── File operations ────────────────────────────────────────────────────────
  /** Creates a new empty file. */
  newFile: () => void;
  /** Opens a file using the File System Access API. */
  openFile: () => Promise<void>;
  /** Saves the current file. */
  saveFile: () => Promise<void>;
  /** Saves the current file with a new name. */
  saveFileAs: () => Promise<void>;
  /** Exports the current canvas as an image. */
  exportImage: () => void;
  /** Exports the current automaton as LaTeX/TikZ. */
  exportLaTeX: () => void;
}

type AutomataStore = AutomataState & AutomataActions;

// ── Helpers ───────────────────────────────────────────────────────────────────

const SIMULATION_RESET = {
  activeNodeIds: new Set<string>(),
  simulationSteps: [] as Set<string>[],
  currentStepIndex: -1,
  simulationError: null,
  simulationAccepted: null,
} as const;

const INITIAL_STATE: AutomataState = {
  nodes: [],
  edges: [],
  editorMode: 'edit',
  editorTool: 'select',
  contentView: 'dashboard',
  sidebarCollapsed: false,
  machineType: null,
  selectedNodeIds: [],
  selectedEdgeIds: [],
  preferences: DEFAULT_PREFERENCES,
  ...SIMULATION_RESET,
};

function parseAndValidate(json: string): SerializedGraph {
  // JSON.parse throws SyntaxError on malformed input — let it propagate.
  const raw: unknown = JSON.parse(json);

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new TypeError('Deserialization error: payload must be a JSON object.');
  }

  const obj = raw as Record<string, unknown>;

  if (!Array.isArray(obj.nodes)) {
    throw new TypeError('Deserialization error: "nodes" must be an array.');
  }

  if (!Array.isArray(obj.edges)) {
    throw new TypeError('Deserialization error: "edges" must be an array.');
  }

  return {
    nodes: obj.nodes as AutomataNode[],
    edges: obj.edges as AutomataEdge[],
  };
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAutomataStore = create<AutomataStore>((set, get) => ({
  ...INITIAL_STATE,
      addNode: (node): void => {
    set((state) => ({ nodes: [...state.nodes, node] }));
  },

  updateNodeLabel: (nodeId, label): void => {
    set((state) => ({
      nodes: state.nodes.map((n) => n.id === nodeId ? { ...n, label } : n),
    }));
  },

  addEdge: (edge): void => {
    set((state) => ({ edges: [...state.edges, edge] }));
  },

  addTransition: (source, target): void => {
    set((state) => ({
      edges: [
        ...state.edges,
        { id: crypto.randomUUID(), source, target, symbols: ['ε'] },
      ],
    }));
  },

  updateEdgeSymbols: (edgeId, symbols): void => {
    set((state) => ({
      edges: state.edges.map((e) =>
        e.id === edgeId ? { ...e, symbols } : e,
      ),
    }));
  },

  markInitial: (id): void => {
    set((state) => ({
      nodes: state.nodes.map((n) => ({ ...n, isInitial: n.id === id })),
    }));
  },

  markAccepting: (id): void => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, isAccepting: !n.isAccepting } : n,
      ),
    }));
  },

  setSelectedElements: (nodeIds, edgeIds): void => {
    set({ selectedNodeIds: nodeIds, selectedEdgeIds: edgeIds });
  },

  deleteSelected: (nodeIds, edgeIds): void => {
    const nodeSet = new Set(nodeIds);
    const edgeSet = new Set(edgeIds);
    set((state) => ({
      nodes: state.nodes.filter((n) => !nodeSet.has(n.id)),
      edges: state.edges.filter((e) => !edgeSet.has(e.id)),
      selectedNodeIds: [],
      selectedEdgeIds: [],
    }));
  },

  clearStore: (): void => { set(INITIAL_STATE); },

  setEditorMode: (mode): void => { set({ editorMode: mode }); },

  setEditorTool: (tool): void => { set({ editorTool: tool }); },

  serialize: (): string => {
    const { nodes, edges } = get();
    return JSON.stringify({ nodes, edges });
  },

  deserialize: (json): void => {
    // Validate BEFORE touching the store — guarantees atomicity on error.
    const { nodes, edges } = parseAndValidate(json);
    set({ nodes, edges });
  },

  onNodesChange: (changes): void => {
    // React Flow reports its own internal bookkeeping (measured pixel size,
    // selection) as NodeChange events too. Our domain model doesn't track
    // either, so forwarding them into the store would replace every node
    // object on every render — which defeats React Flow's reference-equality
    // check in `adoptUserNodes` and wipes its cached handle bounds, breaking
    // drag-to-connect in a self-sustaining remeasure loop. Only apply changes
    // that actually affect domain state (position/add/remove/replace).
    const relevantChanges = changes.filter(
      (c) => c.type !== 'dimensions' && c.type !== 'select',
    );
    if (relevantChanges.length === 0) return;

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

      const updated = applyNodeChanges(relevantChanges, rfNodes);

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

  onEdgesChange: (changes): void => {
    // Mirror the onNodesChange strategy: React Flow emits 'select' change events
    // whenever an edge is clicked/focused (to update its visual selected state).
    // Our domain model does NOT track selection, so applying these changes would
    // call set() on every edge click — triggering a Zustand notification →
    // AutomataCanvas re-render → new flowEdges objects → EditableEdge re-render.
    // That re-render disrupts the <input> focus mid-edit (causing the perceived
    // "one keystroke then lose focus" bug). Only process changes that affect
    // real domain state: remove and replace.
    const relevantChanges = changes.filter(
      (c) => c.type !== 'select',
    );
    if (relevantChanges.length === 0) return;

    set((state) => {
      // AutomataEdge is structurally compatible with RF's Edge minimum shape.
      const updated = applyEdgeChanges(
        relevantChanges,
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

  onConnect: (connection): void => {
    // React Flow types source/target as `string | null`; bail out if either
    // is absent so we never write a corrupt edge into the store.
    if (!connection.source || !connection.target) return;

    const newEdge: AutomataEdge = {
      id: crypto.randomUUID(),
      source: connection.source,
      target: connection.target,
      symbols: ['ε'],
    };
    set((state) => ({ edges: [...state.edges, newEdge] }));
  },

  // ── Simulation actions ──────────────────────────────────────────────────

  startSimulation: (input): void => {
    const { nodes, edges } = get();

    // Always reset before a new run.
    const result = buildAndSimulate(nodes, edges, input);

    if ('kind' in result) {
      // Error path — surface a friendly message, leave graph unchanged.
      const messages: Record<string, string> = {
        NO_INITIAL_STATE: 'The graph must have exactly one initial state.',
        EMPTY_ALPHABET:   'No transitions found — add at least one edge with a symbol.',
        ENGINE_ERROR:     (result as { kind: string; message: string }).message,
      };
      set({
        ...SIMULATION_RESET,
        simulationError: messages[result.kind] ?? 'Unknown simulation error.',
      });
      return;
    }

    // Success: pre-pend the initial closure as step 0, then push per-symbol steps.
    const allSteps: Set<string>[] = [result.initialStep, ...result.steps];

    set({
      simulationSteps: allSteps,
      currentStepIndex: 0,
      activeNodeIds: new Set(result.initialStep),
      simulationError: null,
      // accepted is only known after the last step
      simulationAccepted: input.length === 0 ? result.accepted : null,
    });
  },

  stepForward: (): void => {
    const { simulationSteps, currentStepIndex, simulationAccepted } = get();
    // No-op: not started, or already on the final step.
    if (currentStepIndex < 0 || simulationAccepted !== null) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= simulationSteps.length) return;

    const nextActive = simulationSteps[nextIndex];
    const isLast = nextIndex === simulationSteps.length - 1;

    set((state) => {
      const { nodes } = state;
      const accepted = isLast
        ? [...nextActive].some((id) => nodes.find((n) => n.id === id)?.isAccepting ?? false)
        : null;
      return {
        currentStepIndex: nextIndex,
        activeNodeIds: new Set(nextActive),
        simulationAccepted: accepted,
      };
    });
  },

  resetSimulation: (): void => { set(SIMULATION_RESET); },

  openEditor: (type): void => {
    set({ contentView: 'editor', machineType: type });
  },

  returnToDashboard: (clearWorkspace = false): void => {
    if (clearWorkspace) {
      set({ ...INITIAL_STATE, contentView: 'dashboard', machineType: null });
    } else {
      set({ contentView: 'dashboard', machineType: null });
    }
  },

  /** @deprecated Use returnToDashboard instead. Kept for backward compatibility. */
  returnToMenu: (clearWorkspace = false): void => {
    get().returnToDashboard(clearWorkspace);
  },

  // ── Navigation actions ─────────────────────────────────────────────────────

  setContentView: (view): void => {
    set({ contentView: view });
  },

  toggleSidebar: (): void => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  setSidebarCollapsed: (collapsed): void => {
    set({ sidebarCollapsed: collapsed });
  },

  // ── Preferences actions ─────────────────────────────────────────────────────

  updatePreferences: (prefs): void => {
    set((state) => ({ preferences: { ...state.preferences, ...prefs } }));
  },

  resetPreferences: (): void => {
    set({ preferences: DEFAULT_PREFERENCES });
  },

  // ── File operations (stubs) ─────────────────────────────────────────────────

  newFile: (): void => {
    set((state) => ({
      nodes: [],
      edges: [],
      machineType: null,
      ...SIMULATION_RESET,
    }));
  },

  openFile: async (): Promise<void> => {
    // TODO: Implement File System Access API
    console.warn('openFile not yet implemented');
  },

  saveFile: async (): Promise<void> => {
    // TODO: Implement File System Access API
    console.warn('saveFile not yet implemented');
  },

  saveFileAs: async (): Promise<void> => {
    // TODO: Implement File System Access API
    console.warn('saveFileAs not yet implemented');
  },

  exportImage: (): void => {
    // TODO: Implement canvas export to image
    console.warn('exportImage not yet implemented');
  },

  exportLaTeX: (): void => {
    // TODO: Implement LaTeX/TikZ export
    console.warn('exportLaTeX not yet implemented');
  },
}),
  {
    name: 'turingcanvas-preferences',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ preferences: state.preferences }),
  }
);
