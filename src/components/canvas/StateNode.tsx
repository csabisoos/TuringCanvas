import { useState, type ReactElement } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import { useAutomataStore } from '../../store/useAutomataStore';

// ── Data shape for the custom node ───────────────────────────────────────────

export interface StateNodeData {
  label: string;
  isInitial: boolean;
  isAccepting: boolean;
  isActive: boolean;
  mooreOutput?: string;
  [key: string]: unknown; // satisfies React Flow's Record<string, unknown> constraint
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StateNode({ id, data, isConnectable }: NodeProps<Node<StateNodeData>>): ReactElement {
  const { label, isInitial, isAccepting, isActive, mooreOutput } = data;
  const machineType = useAutomataStore((s) => s.machineType);
  const isMoore = machineType === 'moore' || mooreOutput !== undefined;

  const initialDraft = isMoore && mooreOutput !== undefined ? `${label} / ${mooreOutput}` : label;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(initialDraft);
  const updateNodeLabel = useAutomataStore((s) => s.updateNodeLabel);
  const updateMooreOutput = useAutomataStore((s) => s.updateMooreOutput);

  function commit(): void {
    const trimmed = draft.trim();
    if (trimmed) {
      if (isMoore && trimmed.includes('/')) {
        const parts = trimmed.split('/').map((s) => s.trim());
        if (parts.length >= 2) {
          const lbl = parts[0] ?? '';
          const out = parts[1] ?? '';
          if (lbl) updateNodeLabel(id, lbl);
          updateMooreOutput(id, out);
        } else {
          updateNodeLabel(id, trimmed);
        }
      } else {
        updateNodeLabel(id, trimmed);
      }
    }
    setIsEditing(false);
  }

  // Build a descriptive label for screen readers
  const stateType = isInitial && isAccepting
    ? 'initial and accepting state'
    : isInitial
    ? 'initial state'
    : isAccepting
    ? 'accepting state'
    : 'state';
  const activeDescription = isActive ? ', currently active' : '';
  const nodeAriaLabel = `${label}: ${stateType}${activeDescription}`;

  return (
    <div
      className="relative z-10 flex items-center justify-center"
      role="img"
      aria-label={nodeAriaLabel}
    >
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
          'w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200',
          // Simulation active highlight — amber glow, takes priority
          isActive
            ? 'bg-amber-900/60 ring-4 ring-amber-400 shadow-[0_0_18px_4px_rgba(251,191,36,0.55)]'
            : 'bg-gray-900',
          // When not active: accepting state indigo double-ring; else simple gray border
          !isActive && isAccepting
            ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-indigo-400 border-2 border-indigo-400'
            : '',
          !isActive && !isAccepting
            ? isInitial
              ? 'border-2 border-indigo-400'
              : 'border-2 border-gray-400'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Inner circle (visible for accepting states to create double-circle effect) */}
        {isAccepting && !isActive && (
          <div className="absolute w-10 h-10 rounded-full border border-indigo-400/60" />
        )}

        {/* State label */}
        {isEditing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => { setDraft(e.target.value); }}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setIsEditing(false); }}
            onMouseDown={(e) => { e.stopPropagation(); }}
            className="w-12 text-center text-xs bg-transparent border-b border-indigo-400 text-gray-100 outline-none"
          />
        ) : (
          <span
            onDoubleClick={() => {
              setDraft(isMoore && mooreOutput !== undefined ? `${label} / ${mooreOutput}` : label);
              setIsEditing(true);
            }}
            className="relative z-10 flex flex-col items-center justify-center text-xs font-semibold text-gray-100 select-none text-center leading-tight px-1 break-all max-w-[3rem]"
          >
            <span>{label}</span>
            {isMoore && mooreOutput !== undefined && (
              <>
                <div className="w-full border-t border-gray-500 my-0.5" />
                <span className="text-[10px] font-mono text-purple-300">{mooreOutput}</span>
              </>
            )}
          </span>
        )}
      </div>

      {/* React Flow connection handles — enlarged hit-target so drag-to-connect is reliable */}
      <Handle
        id="target"
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-indigo-300 opacity-0 hover:opacity-100 transition-opacity duration-150"
      />
      <Handle
        id="source"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-indigo-300 opacity-0 hover:opacity-100 transition-opacity duration-150"
      />
    </div>
  );
}

