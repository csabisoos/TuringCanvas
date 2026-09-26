import type { ComponentType, ReactElement } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
} from '@xyflow/react';
import type { Node, NodeProps, Edge, NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useAutomataStore } from '../../store/useAutomataStore';
import { StateNode } from './StateNode';
import type { StateNodeData } from './StateNode';

// ── Custom node registry ──────────────────────────────────────────────────────

/** Alias that satisfies React Flow's ComponentType constraint for nodeTypes. */
type AnyNodeProps = NodeProps<Node<Record<string, unknown>>>;

const nodeTypes: NodeTypes = {
  stateNode: StateNode as ComponentType<AnyNodeProps>,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Maps an `AutomataNode` from the Zustand store to a React Flow `Node`.
 * The `type` field routes React Flow to the `StateNode` renderer.
 */
function toFlowNode(node: {
  id: string;
  position: { x: number; y: number };
  label: string;
  isInitial: boolean;
  isAccepting: boolean;
}): Node<StateNodeData> {
  return {
    id: node.id,
    type: 'stateNode',
    position: node.position,
    data: {
      label: node.label,
      isInitial: node.isInitial,
      isAccepting: node.isAccepting,
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
    type: 'default',
    style: { stroke: '#818cf8', strokeWidth: 2 }, // indigo-400
    labelStyle: { fill: '#e0e7ff', fontSize: 12 }, // indigo-100
    labelBgStyle: { fill: '#1e1b4b', fillOpacity: 0.85 }, // indigo-950
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AutomataCanvas(): ReactElement {
  const storeNodes = useAutomataStore((s) => s.nodes);
  const storeEdges = useAutomataStore((s) => s.edges);

  const flowNodes = storeNodes.map(toFlowNode);
  const flowEdges = storeEdges.map(toFlowEdge);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        // Dragging & edge creation are intentionally disabled in Phase 4 Part 1.
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
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
      </ReactFlow>
    </div>
  );
}
