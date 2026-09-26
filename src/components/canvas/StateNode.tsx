import type { ReactElement } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';

// ── Data shape for the custom node ───────────────────────────────────────────

export interface StateNodeData {
  label: string;
  isInitial: boolean;
  isAccepting: boolean;
  [key: string]: unknown; // satisfies React Flow's Record<string, unknown> constraint
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StateNode({ data }: NodeProps<Node<StateNodeData>>): ReactElement {
  const { label, isInitial, isAccepting } = data;

  return (
    <div className="relative flex items-center justify-center">
      {/* Initial-state arrow indicator */}
      {isInitial && (
        <div className="absolute -left-10 flex items-center" aria-label="Initial state">
          <div className="w-7 h-0.5 bg-indigo-400" />
          {/* Arrowhead via border trick */}
          <div
            className="w-0 h-0"
            style={{
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderLeft: '8px solid rgb(129 140 248)', // indigo-400
            }}
          />
        </div>
      )}

      {/* Outer circle — doubles as the "double ring" for accepting states */}
      <div
        className={[
          'w-14 h-14 rounded-full flex items-center justify-center',
          'bg-gray-900',
          // Accepting state: indigo double-ring; normal: simple gray border
          isAccepting
            ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-indigo-400 border-2 border-indigo-400'
            : 'border-2 border-gray-400',
          // Highlight initial in a subtly different border color
          isInitial && !isAccepting ? 'border-indigo-400' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Inner circle (visible for accepting states to create double-circle effect) */}
        {isAccepting && (
          <div className="absolute w-10 h-10 rounded-full border border-indigo-400/60" />
        )}

        {/* State label */}
        <span className="relative z-10 text-xs font-semibold text-gray-100 select-none text-center leading-tight px-1 break-all max-w-[3rem]">
          {label}
        </span>
      </div>

      {/* React Flow connection handles — hidden visually but functional */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-indigo-500 !border-indigo-300"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-indigo-500 !border-indigo-300"
      />
    </div>
  );
}
