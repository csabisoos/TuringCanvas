import { type ComponentType, type ReactElement, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  MarkerType,
  Panel,
  useOnSelectionChange,
} from '@xyflow/react';
import type { Node, NodeProps, Edge, NodeTypes, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useAutomataStore } from '../../store/useAutomataStore';
import { StateNode } from './StateNode';
import type { StateNodeData } from './StateNode';
import { EditableEdge } from './EditableEdge';

// ── Custom node registry ──────────────────────────────────────────────────────

/** Alias that satisfies React Flow's ComponentType constraint for nodeTypes. */
type AnyNodeProps = NodeProps;

const nodeTypes: NodeTypes = {
  stateNode: StateNode as ComponentType<AnyNodeProps>,
};

const edgeTypes = {
  editableEdge: EditableEdge,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Maps an `AutomataNode` from the Zustand store to a React Flow `Node`.
 * The `type` field routes React Flow to the `StateNode` renderer.
 */
function toFlowNode(
  node: {
    id: string;
    position: { x: number; y: number };
    label: string;
    isInitial: boolean;
    isAccepting: boolean;
  },
  activeNodeIds: Set<string>,
): Node<StateNodeData> {
  return {
    id: node.id,
    type: 'stateNode',
    position: node.position,
    // RF v12 keeps nodes visibility:hidden until it knows their dimensions.
    // StateNode renders a fixed w-14 h-14 circle (56 × 56 px) — declare
    // those here so hasDimensions is true from the very first render.
    width: 56,
    height: 56,
    data: {
      label: node.label,
      isInitial: node.isInitial,
      isAccepting: node.isAccepting,
      isActive: activeNodeIds.has(node.id),
    },
  };
}

/**
 * Maps an `AutomataEdge` from the Zustand store to a React Flow `Edge`.
 * Edge labels show the transition symbols joined by commas.
 */
function toFlowEdge(edge: {
  id: string;
  source: string;
  target: string;
  symbols: string[];
}): Edge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.symbols.join(', '),
    type: 'editableEdge',
    style: { stroke: '#818cf8', strokeWidth: 2 }, // indigo-400
    labelStyle: { fill: '#e0e7ff', fontSize: 12 }, // indigo-100
    labelBgStyle: { fill: '#1e1b4b', fillOpacity: 0.85 }, // indigo-950
    // Automata transitions are directed — always render an arrowhead at the target.
    markerEnd: { type: MarkerType.ArrowClosed, color: '#818cf8' },
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AutomataCanvas(): ReactElement {
  const storeNodes = useAutomataStore((s) => s.nodes);
  const storeEdges = useAutomataStore((s) => s.edges);
  const activeNodeIds = useAutomataStore((s) => s.activeNodeIds);
  const onNodesChange = useAutomataStore((s) => s.onNodesChange);
  const onEdgesChange = useAutomataStore((s) => s.onEdgesChange);
  const onConnect = useAutomataStore((s) => s.onConnect);
  const editorMode = useAutomataStore((s) => s.editorMode);
  const editorTool = useAutomataStore((s) => s.editorTool);
  const setSelectedElements = useAutomataStore((s) => s.setSelectedElements);

  // Mirror React Flow's internal selection into the Zustand store so that
  // sidebar actions (Delete, Mark Initial, etc.) always act on live selection.
  useOnSelectionChange({
    onChange: useCallback(
      ({ nodes, edges }: { nodes: { id: string }[]; edges: { id: string }[] }) => {
        setSelectedElements(
          nodes.map((n) => n.id),
          edges.map((e) => e.id),
        );
      },
      [setSelectedElements],
    ),
  });

  const isSimulating = editorMode === 'simulate';
  // Dragging from a handle only starts a new transition while the "Add Transition"
  // tool is armed — otherwise it would fire accidentally while repositioning states.
  const isConnectToolActive = editorMode === 'edit' && editorTool === 'connect';

  // Wrap onConnect to enforce handle semantics: connection MUST originate from a
  // 'source' handle and terminate at a 'target' handle. This prevents React Flow
  // from inferring direction based on spatial layout (left-to-right bias).
  const handleConnect = useCallback(
    (connection: Connection) => {
      // Only accept connections from explicit source→target handles
      if (connection.sourceHandle !== 'source' || connection.targetHandle !== 'target') {
        return;
      }
      onConnect(connection);
    },
    [onConnect],
  );

  const flowNodes = useMemo(
    () => storeNodes.map((n) => toFlowNode(n, activeNodeIds)),
    [storeNodes, activeNodeIds],
  );
  const flowEdges = useMemo(
    () => storeEdges.map(toFlowEdge),
    [storeEdges],
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        // Disable all graph mutations in simulate mode
        nodesDraggable={!isSimulating}
        nodesConnectable={isConnectToolActive}
        elementsSelectable={!isSimulating}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: false }}
        defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed } }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#374151" // gray-700
        />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor="#4f46e5" // indigo-600
          maskColor="rgba(17,24,39,0.7)"
          style={{ background: '#111827' }} // gray-900
        />
        {isConnectToolActive && (
          <Panel position="top-center" className="mt-4 pointer-events-none">
            <div className="rounded-full bg-emerald-950/90 border border-emerald-700 px-3 py-1 text-xs text-emerald-300 font-medium select-none">
              Connect mode — drag between states to add a transition
            </div>
          </Panel>
        )}
        {storeNodes.length === 0 && (
          <Panel position="top-center" className="mt-20 pointer-events-none">
            <div className="flex flex-col items-center gap-2 text-center select-none">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 font-medium">No states yet</p>
              <p className="text-xs text-gray-600">Click <strong className="text-gray-400">Add State</strong> in the sidebar to begin</p>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
