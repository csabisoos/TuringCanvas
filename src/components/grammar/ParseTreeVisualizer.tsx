import type { ReactElement } from 'react';
import type { ParseTreeNode } from '../../core/grammar/LRParser';

interface ParseTreeVisualizerProps {
  root: ParseTreeNode;
}

interface LayoutNode {
  id: string;
  label: string;
  x: number;
  y: number;
  children: LayoutNode[];
}

export function ParseTreeVisualizer({ root }: ParseTreeVisualizerProps): ReactElement {
  // Compute horizontal spacing and vertical levels
  let nextX = 40;
  const LEVEL_HEIGHT = 65;
  const NODE_SPACING = 55;

  function layoutTree(node: ParseTreeNode, depth: number): LayoutNode {
    if (node.children.length === 0) {
      const x = nextX;
      nextX += NODE_SPACING;
      return { id: node.id, label: node.label, x, y: depth * LEVEL_HEIGHT + 35, children: [] };
    }

    const children = node.children.map((c) => layoutTree(c, depth + 1));
    const firstChild = children[0];
    const lastChild = children[children.length - 1];
    const x = Math.round((firstChild.x + lastChild.x) / 2);

    return {
      id: node.id,
      label: node.label,
      x,
      y: depth * LEVEL_HEIGHT + 35,
      children,
    };
  }

  const layout = layoutTree(root, 0);
  const totalWidth = Math.max(360, nextX + 40);
  const maxDepth = (function getMaxDepth(n: LayoutNode): number {
    if (n.children.length === 0) return n.y;
    return Math.max(...n.children.map(getMaxDepth));
  })(layout);
  const totalHeight = maxDepth + 60;

  // Flatten nodes and edges for SVG rendering
  const lines: { x1: number; y1: number; x2: number; y2: number; id: string }[] = [];
  const nodesToRender: LayoutNode[] = [];

  function collect(node: LayoutNode): void {
    nodesToRender.push(node);
    for (const child of node.children) {
      lines.push({
        id: `${node.id}->${child.id}`,
        x1: node.x,
        y1: node.y,
        x2: child.x,
        y2: child.y,
      });
      collect(child);
    }
  }

  collect(layout);

  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-950 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          Interactive Derivation / Parse Tree
        </span>
        <span className="text-[11px] font-mono text-gray-500">
          Root: {root.label} ({String(nodesToRender.length)} nodes)
        </span>
      </div>

      <div className="w-full overflow-auto max-h-[380px] bg-gray-900/60 rounded-md border border-gray-800/60 flex items-center justify-center p-4">
        <svg width={totalWidth} height={totalHeight} className="overflow-visible select-none">
          {/* Edges */}
          {lines.map((l) => (
            <line
              key={l.id}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="rgb(75, 85, 99)"
              strokeWidth="1.5"
            />
          ))}

          {/* Nodes */}
          {nodesToRender.map((n) => {
            const isLeaf = n.children.length === 0;
            return (
              <g key={n.id} transform={`translate(${String(n.x)}, ${String(n.y)})`}>
                <circle
                  r="16"
                  className={
                    isLeaf
                      ? 'fill-amber-950 stroke-amber-500 stroke-2'
                      : 'fill-indigo-950 stroke-indigo-400 stroke-2'
                  }
                />
                <text
                  textAnchor="middle"
                  dy="4"
                  className={`text-xs font-mono font-bold ${
                    isLeaf ? 'fill-amber-200' : 'fill-indigo-200'
                  }`}
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
