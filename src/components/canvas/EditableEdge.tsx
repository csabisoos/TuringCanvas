import { useState, useRef, useEffect, useCallback, type ReactElement } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Position,
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
 * The perpendicular is always computed from the edge's actual semantic direction
 * (source → target), NOT from a canonical direction based on node IDs. This
 * ensures the arrow direction always matches the semantic source/target.
 */
function getOffsetPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  offset: number,
): [string, number, number] {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
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
 * of states. Edges in the same direction share an offset ladder; edges in
 * the opposite direction use a separate ladder so they fan out independently.
 */
function useParallelEdgeOffset(id: string, source: string, target: string): number {
  const edges = useAutomataStore((s) => s.edges);
  // Filter edges between this pair of nodes
  const pairEdges = edges.filter(
    (e) => (e.source === source && e.target === target) || (e.source === target && e.target === source),
  );
  // Filter to only edges with the SAME semantic direction as this edge
  const sameDirectionEdges = pairEdges.filter(
    (e) => e.source === source && e.target === target,
  );
  const index = sameDirectionEdges.findIndex((e) => e.id === id);
  const count = sameDirectionEdges.length;
  return (index - (count - 1) / 2) * PARALLEL_EDGE_OFFSET;
}

// ── Isolated input component ─────────────────────────────────────────────────
// Rendered as a completely separate component so its local state (draft text)
// is never affected by re-renders of the parent EdgeWrapper. The input manages
// its own value and only calls onCommit / onCancel when editing is done.

interface EdgeInputProps {
  initialValue: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}

function EdgeInput({ initialValue, onCommit, onCancel }: EdgeInputProps): ReactElement {
  const [draft, setDraft] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  // Track whether commit has been called so onBlur doesn't double-fire.
  const committedRef = useRef(false);

  // Focus the input imperatively after mount — more reliable than autoFocus
  // in React 19 concurrent mode where effects run after layout is painted.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    // requestAnimationFrame gives React a chance to flush the DOM update
    // before we try to focus, preventing focus races with RF's own handlers.
    const raf = requestAnimationFrame(() => {
      el.focus();
      el.select();
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleCommit = useCallback(() => {
    if (committedRef.current) return;
    committedRef.current = true;
    onCommit(draft);
  }, [draft, onCommit]);

  const handleBlur = useCallback(() => {
    // Defer slightly so that a click on the canvas doesn't race with commit
    // when the user clicks away — the blur always fires before the pane click.
    handleCommit();
  }, [handleCommit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleCommit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      committedRef.current = true; // suppress blur→commit
      onCancel();
    }
  }, [handleCommit, onCancel]);

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="w-20 text-center text-xs bg-indigo-950 border border-indigo-400 text-indigo-100 outline-none rounded px-1 py-0.5 focus:ring-1 focus:ring-indigo-400"
    />
  );
}

// ── Main edge component ───────────────────────────────────────────────────────

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
}: EdgeProps): ReactElement {
  const offset = useParallelEdgeOffset(id, source, target);

  // React Flow may swap source/target coordinates for right-to-left edges
  // (thinking "source should be left, target should be right"). Our handles are:
  // source = Position.Right, target = Position.Left. Detect and correct this.
  const isSwapped =
    sourcePosition === Position.Left && targetPosition === Position.Right;
  const effSourceX = isSwapped ? targetX : sourceX;
  const effSourceY = isSwapped ? targetY : sourceY;
  const effTargetX = isSwapped ? sourceX : targetX;
  const effTargetY = isSwapped ? sourceY : targetY;
  const effSourcePosition = isSwapped ? targetPosition : sourcePosition;
  const effTargetPosition = isSwapped ? sourcePosition : targetPosition;

  const [edgePath, labelX, labelY] = offset !== 0
    ? getOffsetPath(effSourceX, effSourceY, effTargetX, effTargetY, offset)
    : getBezierPath({
        sourceX: effSourceX,
        sourceY: effSourceY,
        sourcePosition: effSourcePosition,
        targetX: effTargetX,
        targetY: effTargetY,
        targetPosition: effTargetPosition,
      });

  // Read symbols directly from the store by edge id.
  const storeSymbols = useAutomataStore(
    (s) => s.edges.find((e) => e.id === id)?.symbols ?? ['ε'],
  );
  const updateEdgeSymbols = useAutomataStore((s) => s.updateEdgeSymbols);

  const [isEditing, setIsEditing] = useState(false);

  const handleCommit = useCallback((rawValue: string) => {
    const symbols = rawValue.split(',').map((s) => s.trim()).filter(Boolean);
    const finalSymbols = symbols.length > 0 ? symbols : ['ε'];
    updateEdgeSymbols(id, finalSymbols);
    setIsEditing(false);
  }, [id, updateEdgeSymbols]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleLabelClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const displayLabel = storeSymbols.join(', ');

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            // REQUIRED: without pointerEvents: 'all', clicks fall through to
            // the canvas pan/zoom handler and never reach the label or input.
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          // Stop ALL pointer events from bubbling out of this wrapper so that
          // React Flow's pane handlers (selection box, pan) never interfere.
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {isEditing ? (
            <EdgeInput
              initialValue={displayLabel}
              onCommit={handleCommit}
              onCancel={handleCancel}
            />
          ) : (
            <div
              onClick={handleLabelClick}
              className="cursor-pointer bg-indigo-950/85 text-indigo-100 text-xs px-2 py-0.5 rounded border border-transparent hover:border-indigo-400 transition-colors select-none"
            >
              {displayLabel}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
