import { useState, type ReactElement } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { useAutomataStore } from '../../store/useAutomataStore';

export function EditableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  label,
}: EdgeProps): ReactElement {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(label as string);
  const updateEdgeSymbols = useAutomataStore((s) => s.updateEdgeSymbols);

  function commit() {
    const symbols = draft.split(',').map((s) => s.trim()).filter(Boolean);
    const finalSymbols = symbols.length > 0 ? symbols : ['ε'];
    updateEdgeSymbols(id, finalSymbols);
    setIsEditing(false);
  }

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {isEditing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-16 text-center text-xs bg-indigo-950 border border-indigo-400 text-indigo-100 outline-none rounded"
            />
          ) : (
            <div
              onClick={() => {
                setDraft(label as string);
                setIsEditing(true);
              }}
              className="cursor-pointer bg-indigo-950/85 text-indigo-100 text-xs px-2 py-0.5 rounded border border-transparent hover:border-indigo-400"
            >
              {label as string}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
