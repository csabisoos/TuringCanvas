import { type ComponentType, type ReactElement, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  useOnSelectionChange,
} from '@xyflow/react';
import type { Node, NodeProps, Edge, NodeTypes } from '@xyflow/react';
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

  const flowNodes = storeNodes.map((n) => toFlowNode(n, activeNodeIds));
  const flowEdges = storeEdges.map(toFlowEdge);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        // Disable all graph mutations in simulate mode
        nodesDraggable={!isSimulating}
        nodesConnectable={!isSimulating}
        elementsSelectable={!isSimulating}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: false }}
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
