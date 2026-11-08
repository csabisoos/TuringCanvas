import { useState, useMemo, type ReactElement } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';
import { buildComputationTree } from '../../core/computationTreeBuilder';
import type { TreeNode } from '../../types/computationTree';

interface TreeCardProps {
  node: TreeNode;
  onSelectNode: (stateId: string) => void;
}

function TreeCard({ node, onSelectNode }: TreeCardProps): ReactElement {
  const [collapsed, setCollapsed] = useState(false);

  const statusBg =
    node.status === 'accept'
      ? 'border-emerald-600 bg-emerald-950/60 text-emerald-200'
      : node.status === 'reject'
        ? 'border-rose-700 bg-rose-950/40 text-rose-300'
        : 'border-amber-600 bg-amber-950/40 text-amber-200';

  const statusBadge =
    node.status === 'accept' ? '✓ Accept' : node.status === 'reject' ? '✕ Dead End' : '⋯ Active';

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div
        onClick={() => { onSelectNode(node.stateId); }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm cursor-pointer hover:brightness-125 transition-all text-xs ${statusBg}`}
      >
        {node.consumedSymbol !== undefined && (
          <span className="px-1.5 py-0.5 rounded bg-black/40 font-mono text-[10px] text-gray-300 border border-gray-700">
            {node.consumedSymbol}
          </span>
        )}
        <span className="font-bold text-white">{node.stateLabel}</span>
        <span className="font-mono text-gray-400 text-[11px]">
          [{node.remainingInput !== '' ? node.remainingInput : 'ε'}]
        </span>
        <span className="text-[10px] uppercase font-semibold px-1 rounded bg-black/30">
          {statusBadge}
        </span>
        {node.children.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
            className="ml-1 text-[10px] text-gray-400 hover:text-white px-1"
          >
            {collapsed ? `+${String(node.children.length)}` : '−'}
          </button>
        )}
      </div>

      {/* Children branches */}
      {!collapsed && node.children.length > 0 && (
        <div className="flex flex-col items-center mt-2">
          <div className="w-px h-3 bg-gray-700" />
          <div className="flex gap-4 pt-1 border-t border-gray-800">
            {node.children.map((child) => (
              <TreeCard key={child.id} node={child} onSelectNode={onSelectNode} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ComputationTreeDrawer(): ReactElement | null {
  const isTreeModalOpen = useAutomataStore((s) => s.isTreeModalOpen);
  const setTreeModalOpen = useAutomataStore((s) => s.setTreeModalOpen);
  const nodes = useAutomataStore((s) => s.nodes);
  const edges = useAutomataStore((s) => s.edges);
  const setActiveNodeIds = useAutomataStore((s) => s.setActiveNodeIds);

  const [inputStr, setInputStr] = useState('ab');

  const tree = useMemo(() => {
    return buildComputationTree(nodes, edges, inputStr);
  }, [nodes, edges, inputStr]);

  // Statistics
  const stats = useMemo(() => {
    let acceptCount = 0;
    let rejectCount = 0;
    let totalNodes = 0;

    function count(n: TreeNode): void {
      totalNodes++;
      if (n.status === 'accept') acceptCount++;
      if (n.status === 'reject') rejectCount++;
      for (const child of n.children) {
        count(child);
      }
    }

    if (tree) count(tree);
    return { acceptCount, rejectCount, totalNodes };
  }, [tree]);

  if (!isTreeModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden text-gray-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-950/60">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Nondeterministic Computation Tree</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-400 border border-indigo-700 font-normal">
                Branching Paths
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-950 px-3 py-1 rounded-lg border border-gray-800 text-xs">
              <span className="text-gray-400">Test String:</span>
              <input
                type="text"
                value={inputStr}
                onChange={(e) => { setInputStr(e.target.value); }}
                placeholder="Enter string (e.g. ab)"
                className="bg-transparent text-indigo-300 font-mono focus:outline-none w-28"
              />
            </div>
            <button
              onClick={() => { setTreeModalOpen(false); }}
              className="text-gray-400 hover:text-white px-2 py-1 text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Metrics Banner */}
        <div className="px-6 py-2 bg-gray-950/80 border-b border-gray-800 flex items-center gap-6 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-gray-400">Accepting Configurations:</span>
            <span className="font-bold text-emerald-400">{stats.acceptCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-gray-400">Dead Ends:</span>
            <span className="font-bold text-rose-400">{stats.rejectCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Total Tree Nodes:</span>
            <span className="font-bold text-indigo-400">{stats.totalNodes}</span>
          </div>
          <span className="text-[11px] text-gray-500 font-sans ml-auto">
            Click any node to highlight on canvas
          </span>
        </div>

        {/* Tree Render Canvas */}
        <div className="flex-1 overflow-auto p-8 bg-gray-950 flex justify-center items-start">
          {tree ? (
            <TreeCard
              node={tree}
              onSelectNode={(stateId) => {
                setActiveNodeIds([stateId]);
              }}
            />
          ) : (
            <div className="text-center text-gray-500 py-16">
              No initial state defined on the canvas. Design an automaton with a start state first.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
