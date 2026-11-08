import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { NodeChange, EdgeChange, Connection } from '@xyflow/react';
import type { AutomataNode, AutomataEdge } from '../types/ui';
import type { FastRunResult } from '../types/simulation';
import type { TestCase } from '../types/batchTest';
import type { PDASimulationStep } from '../types/pda';
import { buildPDAFromCanvas } from '../core/PDA';
import type { TMStep } from '../types/tm';
import { buildTMFromCanvas } from '../core/TM';
import type { TransducerStep } from '../types/transducers';
import { buildMealyFromCanvas, buildMooreFromCanvas } from './transducerAdapter';
import { buildAndSimulate, fastRun } from './simulationAdapter';
import { completeDFA } from '../core/trapStateGenerator';
import { parseJFF } from '../core/io/JFFParser';
import { serializeJFF } from '../core/io/JFFSerializer';
import { exportToTikZ } from '../core/io/TikZExporter';
import { autoLayout } from '../core/layout/graphLayout';
import type { LayoutAlgorithm } from '../core/layout/graphLayout';

// ── Serialized payload shape ──────────────────────────────────────────────────

interface SerializedGraph {
  nodes: AutomataNode[];
  edges: AutomataEdge[];
}

// ── Store types ───────────────────────────────────────────────────────────────

export type ContentView =
  | 'dashboard'
  | 'editor'
  | 'settings'
  | 'help'
  | 'regex'
  | 'grammar'
  | 'pumping'
  | 'lsystem';
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
  /** Pushdown Automata simulation steps with stack contents; null for standard FA. */
  pdaSteps: PDASimulationStep[] | null;
  /** Index of the selected non-deterministic configuration branch in current PDA step. */
  selectedPdaConfigIndex: number;
  /** 1-Tape Turing Machine simulation steps with tape ribbon; null for other machines. */
  tmSteps: TMStep[] | null;
  /** Transducer (Mealy / Moore) simulation steps; null for standard FA. */
  transducerSteps: TransducerStep[] | null;
  /** Cumulative transducer output produced during simulation. */
  transducerOutput: string | null;
  /** Result of instant fast simulation and trace modal; null when not run. */
  fastRunResult: FastRunResult | null;
  /** Test cases for multiple run batch testing. */
  testCases: TestCase[];
  /** Whether the batch testing modal is open. */
  isBatchModalOpen: boolean;
  /** Whether the LaTeX/TikZ export modal is open. */
  isLatexModalOpen: boolean;
  /** Whether the interactive NFA to DFA conversion modal is open. */
  isNfaToDfaModalOpen: boolean;
  /** Whether the DFA minimization modal is open. */
  isMinimizationModalOpen: boolean;
  /** Whether the GNFA state elimination modal is open. */
  isGnfaModalOpen: boolean;
  /** Whether the automata comparison / equivalence modal is open. */
  isCompareModalOpen: boolean;
  /** Whether the computation tree visualizer modal is open. */
  isTreeModalOpen: boolean;
  /** Whether the CFG <-> PDA conversion modal is open. */
  isCfgPdaModalOpen: boolean;
  /** Generated LaTeX/TikZ code. */
  latexCode: string;
  /** Undo history stack. */
  past: { nodes: AutomataNode[]; edges: AutomataEdge[] }[];
  /** Redo history stack. */
  future: { nodes: AutomataNode[]; edges: AutomataEdge[] }[];

  // ── Preferences ───────────────────────────────────────────────────────────
  preferences: UserPreferences;
}

interface AutomataActions {
  addNode: (node: AutomataNode) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  updateMooreOutput: (nodeId: string, output: string) => void;
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
  /** Reverts the last graph action. */
  undo: () => void;
  /** Re-applies the next undone graph action. */
  redo: () => void;
  /** Whether an undo operation is available. */
  canUndo: () => boolean;
  /** Whether a redo operation is available. */
  canRedo: () => boolean;
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
   * Reverts the simulation to the previous step.
   * No-ops if we are at step 0 or not running.
   */
  stepBack: () => void;
  /**
   * Jumps directly to any step index in the active simulation.
   */
  jumpToStep: (stepIndex: number) => void;
  /**
   * Sets the active configuration branch index for PDA simulation.
   */
  setSelectedPdaConfigIndex: (index: number) => void;
  /**
   * Runs an instant fast simulation on the input string and records the execution trace.
   */
  runFastSimulation: (input: string) => void;
  /**
   * Clears the fast simulation result.
   */
  clearFastRun: () => void;

  // ── Batch testing actions ──────────────────────────────────────────────────
  addTestCase: (input: string, expected?: 'accept' | 'reject') => void;
  removeTestCase: (id: string) => void;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  clearTestCases: () => void;
  runAllTestCases: () => void;
  setBatchModalOpen: (open: boolean) => void;
  /** Completes an incomplete DFA by adding a trap state and all missing transitions. */
  completeDFAWithTrap: () => void;
  /** Automatically arranges nodes on the canvas according to the given algorithm. */
  applyAutoLayout: (algorithm: LayoutAlgorithm) => void;
  /** Sets whether the interactive NFA to DFA modal is open. */
  setNfaToDfaModalOpen: (open: boolean) => void;
  /** Sets whether the DFA minimization modal is open. */
  setMinimizationModalOpen: (open: boolean) => void;
  /** Sets whether the GNFA state elimination modal is open. */
  setGnfaModalOpen: (open: boolean) => void;
  /** Sets whether the automata comparison / equivalence modal is open. */
  setCompareModalOpen: (open: boolean) => void;
  /** Sets whether the computation tree visualizer modal is open. */
  setTreeModalOpen: (open: boolean) => void;
  /** Sets whether the CFG <-> PDA conversion modal is open. */
  setCfgPdaModalOpen: (open: boolean) => void;
  /** Sets active highlighted node IDs on the canvas. */
  setActiveNodeIds: (ids: string[]) => void;
  /** Replaces the current canvas with the converted DFA nodes and edges. */
  applyConvertedDFA: (nodes: AutomataNode[], edges: AutomataEdge[]) => void;
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
  /** Closes the LaTeX export modal. */
  closeLatexModal: () => void;
  /** Imports a JFLAP .jff XML file string into the current workspace. */
  importJFF: (xmlString: string) => void;
  /** Exports the current automaton as a JFLAP .jff XML string. */
  exportJFF: () => string;
}

type AutomataStore = AutomataState & AutomataActions;

// ── Helpers ───────────────────────────────────────────────────────────────────

const MAX_HISTORY = 50;

function snapshot(
  nodes: AutomataNode[],
  edges: AutomataEdge[],
): { nodes: AutomataNode[]; edges: AutomataEdge[] } {
  return {
    nodes: nodes.map((n) => ({ ...n, position: { ...n.position } })),
    edges: edges.map((e) => ({ ...e, symbols: [...e.symbols] })),
  };
}

function recordPast(
  past: { nodes: AutomataNode[]; edges: AutomataEdge[] }[],
  nodes: AutomataNode[],
  edges: AutomataEdge[],
): { nodes: AutomataNode[]; edges: AutomataEdge[] }[] {
  const newPast = [...past, snapshot(nodes, edges)];
  if (newPast.length > MAX_HISTORY) {
    newPast.shift();
  }
  return newPast;
}

const SIMULATION_RESET = {
  activeNodeIds: new Set<string>(),
  simulationSteps: [] as Set<string>[],
  currentStepIndex: -1,
  simulationError: null,
  simulationAccepted: null,
  fastRunResult: null as FastRunResult | null,
  pdaSteps: null as PDASimulationStep[] | null,
  selectedPdaConfigIndex: 0,
  tmSteps: null as TMStep[] | null,
  transducerSteps: null as TransducerStep[] | null,
  transducerOutput: null as string | null,
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
  testCases: [],
  isBatchModalOpen: false,
  isLatexModalOpen: false,
  isNfaToDfaModalOpen: false,
  isMinimizationModalOpen: false,
  isGnfaModalOpen: false,
  isCompareModalOpen: false,
  isTreeModalOpen: false,
  isCfgPdaModalOpen: false,
  latexCode: '',
  past: [],
  future: [],
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

export const useAutomataStore = create<AutomataStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,
      addNode: (node): void => {
        set((state) => ({
          past: recordPast(state.past, state.nodes, state.edges),
          future: [],
          nodes: [...state.nodes, node],
        }));
      },

      updateNodeLabel: (nodeId, label): void => {
        set((state) => ({
          past: recordPast(state.past, state.nodes, state.edges),
          future: [],
          nodes: state.nodes.map((n) => n.id === nodeId ? { ...n, label } : n),
        }));
      },

      updateMooreOutput: (nodeId, output): void => {
        set((state) => ({
          past: recordPast(state.past, state.nodes, state.edges),
          future: [],
          nodes: state.nodes.map((n) =>
            n.id === nodeId ? { ...n, mooreOutput: output } : n,
          ),
        }));
      },

      addEdge: (edge): void => {
        set((state) => ({
          past: recordPast(state.past, state.nodes, state.edges),
          future: [],
          edges: [...state.edges, edge],
        }));
      },

      addTransition: (source, target): void => {
        set((state) => ({
          past: recordPast(state.past, state.nodes, state.edges),
          future: [],
          edges: [
            ...state.edges,
            { id: crypto.randomUUID(), source, target, symbols: ['ε'] },
          ],
        }));
      },

      updateEdgeSymbols: (edgeId, symbols): void => {
        set((state) => ({
          past: recordPast(state.past, state.nodes, state.edges),
          future: [],
          edges: state.edges.map((e) =>
            e.id === edgeId ? { ...e, symbols } : e,
          ),
        }));
      },

      markInitial: (id): void => {
        set((state) => ({
          past: recordPast(state.past, state.nodes, state.edges),
          future: [],
          nodes: state.nodes.map((n) => ({ ...n, isInitial: n.id === id })),
        }));
      },

      markAccepting: (id): void => {
        set((state) => ({
          past: recordPast(state.past, state.nodes, state.edges),
          future: [],
          nodes: state.nodes.map((n) =>
            n.id === id ? { ...n, isAccepting: !n.isAccepting } : n,
          ),
        }));
      },

      setSelectedElements: (nodeIds, edgeIds): void => {
        set({ selectedNodeIds: nodeIds, selectedEdgeIds: edgeIds });
      },

      deleteSelected: (nodeIds, edgeIds): void => {
        if (nodeIds.length === 0 && edgeIds.length === 0) return;
        const nodeSet = new Set(nodeIds);
        const edgeSet = new Set(edgeIds);
        set((state) => ({
          past: recordPast(state.past, state.nodes, state.edges),
          future: [],
          nodes: state.nodes.filter((n) => !nodeSet.has(n.id)),
          edges: state.edges.filter((e) => !edgeSet.has(e.id)),
          selectedNodeIds: [],
          selectedEdgeIds: [],
        }));
      },

      clearStore: (): void => {
        set({
          ...INITIAL_STATE,
          past: [],
          future: [],
        });
      },

      undo: (): void => {
        const { past, future, nodes, edges } = get();
        if (past.length === 0) return;

        const previous = past[past.length - 1];
        const newPast = past.slice(0, -1);
        const newFuture = [snapshot(nodes, edges), ...future];

        set({
          past: newPast,
          future: newFuture,
          nodes: previous.nodes,
          edges: previous.edges,
          selectedNodeIds: [],
          selectedEdgeIds: [],
          ...SIMULATION_RESET,
        });
      },

      redo: (): void => {
        const { past, future, nodes, edges } = get();
        if (future.length === 0) return;

        const next = future[0];
        const newFuture = future.slice(1);
        const newPast = [...past, snapshot(nodes, edges)];

        set({
          past: newPast,
          future: newFuture,
          nodes: next.nodes,
          edges: next.edges,
          selectedNodeIds: [],
          selectedEdgeIds: [],
          ...SIMULATION_RESET,
        });
      },

      canUndo: (): boolean => {
        return get().past.length > 0;
      },

      canRedo: (): boolean => {
        return get().future.length > 0;
      },

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
    const { nodes, edges, machineType } = get();

    // Check if graph is a Turing Machine
    const isTmMode =
      machineType === 'tm' ||
      edges.some((e) =>
        e.symbols.some(
          (s) =>
            s.includes(';') &&
            (s.includes(', R') ||
              s.includes(', L') ||
              s.includes(', S') ||
              s.includes(',R') ||
              s.includes(',L') ||
              s.includes(',S')),
        ),
      );

    if (isTmMode) {
      const tmResult = buildTMFromCanvas(nodes, edges);
      if (tmResult.error || !tmResult.tm) {
        set({
          ...SIMULATION_RESET,
          simulationError: tmResult.error ?? 'Invalid Turing Machine graph.',
        });
        return;
      }
      const sim = tmResult.tm.simulate(input);
      const allSteps: Set<string>[] = sim.steps.map(
        (s) => new Set([s.stateId]),
      );
      const isAccepted = sim.accepted;

      set({
        ...SIMULATION_RESET,
        tmSteps: sim.steps,
        simulationSteps: allSteps,
        currentStepIndex: 0,
        activeNodeIds: allSteps[0] ?? new Set(),
        simulationAccepted: sim.steps.length === 1 ? isAccepted : null,
        simulationError: null,
      });
      return;
    }

    // Check if graph is a Mealy Machine
    const isMealyMode =
      machineType === 'mealy' ||
      edges.some((e) => e.symbols.some((s) => s.includes('/') && !s.includes(';')));

    if (isMealyMode) {
      const mealyResult = buildMealyFromCanvas(nodes, edges);
      if (mealyResult.error || !mealyResult.mealy) {
        set({
          ...SIMULATION_RESET,
          simulationError: mealyResult.error ?? 'Invalid Mealy Machine graph.',
        });
        return;
      }
      try {
        const sim = mealyResult.mealy.simulate(input);
        const allSteps: Set<string>[] = sim.steps.map(
          (s) => new Set([s.stateId]),
        );
        // Prepend initial state as step 0
        const initialNodes = nodes.filter((n) => n.isInitial);
        const initId = initialNodes[0]?.id ?? '';
        const fullSteps: Set<string>[] = [new Set([initId]), ...allSteps];

        set({
          ...SIMULATION_RESET,
          transducerSteps: sim.steps,
          transducerOutput: sim.output,
          simulationSteps: fullSteps,
          currentStepIndex: 0,
          activeNodeIds: fullSteps[0] ?? new Set(),
          simulationAccepted: true,
          simulationError: null,
        });
        return;
      } catch (err) {
        set({
          ...SIMULATION_RESET,
          simulationError: err instanceof Error ? err.message : String(err),
        });
        return;
      }
    }

    // Check if graph is a Moore Machine
    const isMooreMode =
      machineType === 'moore' ||
      nodes.some((n) => n.mooreOutput !== undefined);

    if (isMooreMode) {
      const mooreResult = buildMooreFromCanvas(nodes, edges);
      if (mooreResult.error || !mooreResult.moore) {
        set({
          ...SIMULATION_RESET,
          simulationError: mooreResult.error ?? 'Invalid Moore Machine graph.',
        });
        return;
      }
      try {
        const sim = mooreResult.moore.simulate(input);
        const allSteps: Set<string>[] = sim.steps.map(
          (s) => new Set([s.stateId]),
        );

        set({
          ...SIMULATION_RESET,
          transducerSteps: sim.steps,
          transducerOutput: sim.output,
          simulationSteps: allSteps,
          currentStepIndex: 0,
          activeNodeIds: allSteps[0] ?? new Set(),
          simulationAccepted: true,
          simulationError: null,
        });
        return;
      } catch (err) {
        set({
          ...SIMULATION_RESET,
          simulationError: err instanceof Error ? err.message : String(err),
        });
        return;
      }
    }

    // Check if graph is a PDA
    const isPdaMode =
      machineType === 'pda' ||
      edges.some((e) => e.symbols.some((s) => s.includes(';')));

    if (isPdaMode) {
      const pdaResult = buildPDAFromCanvas(nodes, edges);
      if (pdaResult.error || !pdaResult.pda) {
        set({
          ...SIMULATION_RESET,
          simulationError: pdaResult.error ?? 'Invalid PDA graph.',
        });
        return;
      }
      const steps = pdaResult.pda.getSimulationSteps(input);
      const allSteps: Set<string>[] = steps.map(
        (s) => new Set(s.configurations.map((c) => c.stateId)),
      );
      const lastStep = steps[steps.length - 1];
      const isAccepted = lastStep.accepted;

      set({
        ...SIMULATION_RESET,
        pdaSteps: steps,
        selectedPdaConfigIndex: 0,
        simulationSteps: allSteps,
        currentStepIndex: 0,
        activeNodeIds: allSteps[0] ?? new Set(),
        simulationAccepted: steps.length === 1 ? isAccepted : null,
        simulationError: null,
      });
      return;
    }

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

  stepBack: (): void => {
    const { simulationSteps, currentStepIndex } = get();
    if (currentStepIndex <= 0) return;

    const prevIndex = currentStepIndex - 1;
    const prevActive = simulationSteps[prevIndex];

    set({
      currentStepIndex: prevIndex,
      activeNodeIds: new Set(prevActive),
      simulationAccepted: null,
    });
  },

  jumpToStep: (stepIndex: number): void => {
    const { simulationSteps, nodes } = get();
    if (simulationSteps.length === 0) return;
    if (stepIndex < 0 || stepIndex >= simulationSteps.length) return;

    const active = simulationSteps[stepIndex];
    const isLast = stepIndex === simulationSteps.length - 1;
    const accepted = isLast
      ? [...active].some((id) => nodes.find((n) => n.id === id)?.isAccepting ?? false)
      : null;

    set({
      currentStepIndex: stepIndex,
      activeNodeIds: new Set(active),
      simulationAccepted: accepted,
      selectedPdaConfigIndex: 0,
    });
  },

  setSelectedPdaConfigIndex: (index: number): void => {
    set({ selectedPdaConfigIndex: index });
  },

  resetSimulation: (): void => { set(SIMULATION_RESET); },

  runFastSimulation: (input: string): void => {
    const { nodes, edges } = get();
    const res = fastRun(nodes, edges, input);
    if ('kind' in res) {
      const messages: Record<string, string> = {
        NO_INITIAL_STATE: 'The automaton must have exactly one initial state.',
        EMPTY_ALPHABET: 'The automaton has no transitions.',
        ENGINE_ERROR: 'Simulation failed: internal engine error.',
      };
      set({
        fastRunResult: null,
        simulationError: messages[res.kind] ?? 'Unknown simulation error.',
      });
      return;
    }
    set({
      fastRunResult: res,
      simulationError: null,
    });
  },

  clearFastRun: (): void => {
    set({ fastRunResult: null });
  },

  addTestCase: (input: string, expected?: 'accept' | 'reject'): void => {
    const id = `tc_${Date.now().toString()}_${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({
      testCases: [...state.testCases, { id, input, expected }],
    }));
  },

  removeTestCase: (id: string): void => {
    set((state) => ({
      testCases: state.testCases.filter((tc) => tc.id !== id),
    }));
  },

  updateTestCase: (id: string, updates: Partial<TestCase>): void => {
    set((state) => ({
      testCases: state.testCases.map((tc) => (tc.id === id ? { ...tc, ...updates } : tc)),
    }));
  },

  clearTestCases: (): void => {
    set({ testCases: [] });
  },

  runAllTestCases: (): void => {
    const { nodes, edges, testCases } = get();
    const updated = testCases.map((tc) => {
      const res = buildAndSimulate(nodes, edges, tc.input);
      if ('kind' in res) {
        return {
          ...tc,
          actual: 'error' as const,
          passed: false,
          errorMessage: res.kind === 'NO_INITIAL_STATE'
            ? 'Must have exactly one initial state'
            : 'Simulation error',
        };
      }
      const actual = res.accepted ? ('accept' as const) : ('reject' as const);
      const passed = tc.expected === undefined || tc.expected === actual;
      return {
        ...tc,
        actual,
        passed,
        errorMessage: undefined,
      };
    });
    set({ testCases: updated });
  },

  setBatchModalOpen: (open: boolean): void => {
    set({ isBatchModalOpen: open });
  },

  completeDFAWithTrap: (): void => {
    const { nodes, edges, past } = get();
    const completed = completeDFA(nodes, edges);
    set({
      past: recordPast(past, nodes, edges),
      future: [],
      nodes: completed.nodes,
      edges: completed.edges,
    });
  },

  applyAutoLayout: (algorithm): void => {
    const { nodes, edges, past } = get();
    if (nodes.length <= 1) return;
    const laidOutNodes = autoLayout(nodes, edges, algorithm);
    set({
      past: recordPast(past, nodes, edges),
      future: [],
      nodes: laidOutNodes,
    });
  },

  setNfaToDfaModalOpen: (open: boolean): void => {
    set({ isNfaToDfaModalOpen: open });
  },

  setMinimizationModalOpen: (open: boolean): void => {
    set({ isMinimizationModalOpen: open });
  },

  setGnfaModalOpen: (open: boolean): void => {
    set({ isGnfaModalOpen: open });
  },

  setCompareModalOpen: (open: boolean): void => {
    set({ isCompareModalOpen: open });
  },

  setTreeModalOpen: (open: boolean): void => {
    set({ isTreeModalOpen: open });
  },

  setCfgPdaModalOpen: (open: boolean): void => {
    set({ isCfgPdaModalOpen: open });
  },

  setActiveNodeIds: (ids: string[]): void => {
    set({ activeNodeIds: new Set(ids) });
  },

  applyConvertedDFA: (nodes: AutomataNode[], edges: AutomataEdge[]): void => {
    const { past, nodes: prevNodes, edges: prevEdges } = get();
    set({
      past: recordPast(past, prevNodes, prevEdges),
      future: [],
      nodes,
      edges,
      isNfaToDfaModalOpen: false,
  isMinimizationModalOpen: false,
  isGnfaModalOpen: false,
  isCompareModalOpen: false,
  isTreeModalOpen: false,
  isCfgPdaModalOpen: false,
      ...SIMULATION_RESET,
    });
  },

  openEditor: (type): void => {
    if (type === 'regex') {
      set({ contentView: 'regex', machineType: type });
    } else if (type === 'grammar') {
      set({ contentView: 'grammar', machineType: type });
    } else if (type === 'l-system') {
      set({ contentView: 'lsystem', machineType: type });
    } else if (type === 'reg-pumping' || type === 'cfg-pumping') {
      set({ contentView: 'pumping', machineType: type });
    } else {
      set({ contentView: 'editor', machineType: type });
    }
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
    set(() => ({
      nodes: [],
      edges: [],
      machineType: null,
      ...SIMULATION_RESET,
    }));
  },

  openFile: async (): Promise<void> => {
    // TODO: Implement File System Access API
    await Promise.resolve();
    console.warn('openFile not yet implemented');
  },

  saveFile: async (): Promise<void> => {
    // TODO: Implement File System Access API
    await Promise.resolve();
    console.warn('saveFile not yet implemented');
  },

  saveFileAs: async (): Promise<void> => {
    // TODO: Implement File System Access API
    await Promise.resolve();
    console.warn('saveFileAs not yet implemented');
  },

  exportImage: (): void => {
    // TODO: Implement canvas export to image
    console.warn('exportImage not yet implemented');
  },

  exportLaTeX: (): void => {
    const { nodes, edges } = get();
    const code = exportToTikZ(nodes, edges);
    set({
      latexCode: code,
      isLatexModalOpen: true,
    });
  },

  closeLatexModal: (): void => {
    set({ isLatexModalOpen: false });
  },

  importJFF: (xmlString: string): void => {
    const { nodes, edges } = parseJFF(xmlString);
    set({
      nodes,
      edges,
      selectedNodeIds: [],
      selectedEdgeIds: [],
      ...SIMULATION_RESET,
    });
  },

  exportJFF: (): string => {
    const { nodes, edges } = get();
    return serializeJFF(nodes, edges);
  },
    }),
    {
      name: 'turingcanvas-preferences',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ preferences: state.preferences }),
    }
  )
);
