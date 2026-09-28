import { useState, type ReactElement } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { useAutomataStore } from '../../store/useAutomataStore';

/** Perpendicular pixel offset applied per parallel edge sharing a node pair. */
const PARALLEL_EDGE_OFFSET = 28;

/**
 * A quadratic Bezier path whose control point is offset perpendicular to the
 * straight line between source and target. Used instead of `getBezierPath`
 * when a reverse or duplicate transition exists between the same two nodes,
 * so A→B and B→A (or multiple A→B edges) fan out instead of overlapping.
 *
 * `flip` reverses the perpendicular's sign for edges that run "backwards"
 * relative to the pair's canonical direction (see `useParallelEdgeOffset`) —
 * without it, A→B and B→A would each negate the other's offset and land
 * back on the same curve.
 */
function getOffsetPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  offset: number,
  flip: boolean,
): [string, number, number] {
  const rawDx = targetX - sourceX;
  const rawDy = targetY - sourceY;
  const dx = flip ? -rawDx : rawDx;
  const dy = flip ? -rawDy : rawDy;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  const midX = (sourceX + targetX) / 2 + nx * offset;
  const midY = (sourceY + targetY) / 2 + ny * offset;
  return [`M ${String(sourceX)},${String(sourceY)} Q ${String(midX)},${String(midY)} ${String(targetX)},${String(targetY)}`, midX, midY];
}

/**
 * Finds how far this edge should be pushed off the straight source-target
 * line, so that it doesn't overlap other transitions between the same pair
 * of states (in either direction — A→B and B→A share the same offset ladder).
 */
function useParallelEdgeOffset(id: string, source: string, target: string): number {
  const edges = useAutomataStore((s) => s.edges);
  const pairEdges = edges.filter(
    (e) => (e.source === source && e.target === target) || (e.source === target && e.target === source),
  );
  const index = pairEdges.findIndex((e) => e.id === id);
  const count = pairEdges.length;
  return (index - (count - 1) / 2) * PARALLEL_EDGE_OFFSET;
}

export function EditableEdge({
  id,
  source,
  target,
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
  const offset = useParallelEdgeOffset(id, source, target);
  const [edgePath, labelX, labelY] = offset !== 0
    ? getOffsetPath(sourceX, sourceY, targetX, targetY, offset, source > target)
    : getBezierPath({
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
