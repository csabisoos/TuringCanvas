import React, { useMemo, useState } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';
import { DFAMinimizer, type MinimizationResult } from '../../core/DFAMinimizer';

export const DfaMinimizationModal: React.FC = (): React.ReactElement | null => {
  const isOpen = useAutomataStore((s) => s.isMinimizationModalOpen);
  const setOpen = useAutomataStore((s) => s.setMinimizationModalOpen);
  const setNfaToDfaModalOpen = useAutomataStore((s) => s.setNfaToDfaModalOpen);
  const applyConvertedDFA = useAutomataStore((s) => s.applyConvertedDFA);
  const nodes = useAutomataStore((s) => s.nodes);
  const edges = useAutomataStore((s) => s.edges);

  const [activeTab, setActiveTab] = useState<'matrix' | 'partitions'>('matrix');

  // Derive minimization computation
  const { minimization, error } = useMemo<{
    minimization: MinimizationResult | null;
    error: string | null;
  }>(() => {
    if (!isOpen) return { minimization: null, error: null };

    const parsed = DFAMinimizer.buildDFADataFromCanvas(nodes, edges);
    if (parsed.error || !parsed.dfaData) {
      return { minimization: null, error: parsed.error ?? 'Invalid DFA.' };
    }

    try {
      const result = DFAMinimizer.minimize(parsed.dfaData);
      return { minimization: result, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Minimization failed.';
      return { minimization: null, error: msg };
    }
  }, [isOpen, nodes, edges]);

  if (!isOpen) return null;

  const handleApply = (): void => {
    if (!minimization) return;
    const visual = DFAMinimizer.minimalDfaToVisualGraph(minimization.minimalDFA);
    applyConvertedDFA(visual.nodes, visual.edges);
    setOpen(false);
  };

  const reachableNodes = nodes.filter(
    (n) => !minimization?.unreachableStates.includes(n.id),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="flex flex-col bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-amber-400">⚡</span> DFA Minimization
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hopcroft & Moore Equivalence Partitioning & Distinguishable Pairs
            </p>
          </div>
          <button
            onClick={(): void => {
              setOpen(false);
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error ? (
            <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-6 text-center space-y-4">
              <div className="text-3xl">⚠️</div>
              <h3 className="text-lg font-semibold text-rose-300">
                Cannot Minimize Current Graph
              </h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto">{error}</p>
              {error.includes('NFA') && (
                <button
                  onClick={(): void => {
                    setOpen(false);
                    setNfaToDfaModalOpen(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition inline-flex items-center gap-2"
                >
                  <span>🪄</span> Open NFA → DFA Wizard
                </button>
              )}
            </div>
          ) : minimization ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-400">State Reduction</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">
                    {reachableNodes.length.toString()} →{' '}
                    {minimization.minimalDFA.data.states.size.toString()}
                  </div>
                </div>
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-400">Unreachable Removed</div>
                  <div className="text-lg font-bold text-amber-400 mt-1">
                    {minimization.unreachableStates.length.toString()}
                  </div>
                </div>
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-400">Distinguishable Pairs</div>
                  <div className="text-lg font-bold text-sky-400 mt-1">
                    {minimization.distinguishablePairs.size.toString()}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-800">
                <button
                  onClick={(): void => {
                    setActiveTab('matrix');
                  }}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                    activeTab === 'matrix'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Distinguishable Pairs Table
                </button>
                <button
                  onClick={(): void => {
                    setActiveTab('partitions');
                  }}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                    activeTab === 'partitions'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Equivalence Partitions Tree
                </button>
              </div>

              {/* Tab 1: Matrix */}
              {activeTab === 'matrix' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">
                    Triangular table filling: Cell (p, q) is marked ✕ if states
                    p and q produce distinct acceptance behaviors for some input
                    string. Equivalent states are marked ≡.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="border-collapse text-xs">
                      <thead>
                        <tr>
                          <th className="p-2 border border-slate-800 bg-slate-950 text-slate-500">
                            State
                          </th>
                          {reachableNodes.slice(0, -1).map((n) => (
                            <th
                              key={n.id}
                              className="p-2 border border-slate-800 bg-slate-800/80 font-mono text-slate-300"
                            >
                              {n.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reachableNodes.slice(1).map((rowNode, rIdx) => {
                          const rowOriginalIdx = rIdx + 1;
                          return (
                            <tr key={rowNode.id}>
                              <td className="p-2 border border-slate-800 bg-slate-800/80 font-mono text-slate-300 font-semibold">
                                {rowNode.label}
                              </td>
                              {reachableNodes
                                .slice(0, rowOriginalIdx)
                                .map((colNode) => {
                                  const pairKey = DFAMinimizer.makePairKey(
                                    rowNode.id,
                                    colNode.id,
                                  );
                                  const isDist =
                                    minimization.distinguishablePairs.has(
                                      pairKey,
                                    );
                                  return (
                                    <td
                                      key={colNode.id}
                                      className={`p-2 border border-slate-800 text-center font-mono font-bold ${
                                        isDist
                                          ? 'text-rose-400 bg-rose-950/20'
                                          : 'text-emerald-400 bg-emerald-950/30'
                                      }`}
                                      title={`${rowNode.label} & ${colNode.label}: ${isDist ? 'Distinguishable' : 'Equivalent'}`}
                                    >
                                      {isDist ? '✕' : '≡'}
                                    </td>
                                  );
                                })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 2: Partitions Tree */}
              {activeTab === 'partitions' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">
                    Iterative partition refinement from initial split {`{F}`} and{' '}
                    {`{Q \\ F}`} to final equivalence classes:
                  </p>
                  <div className="space-y-3">
                    {minimization.partitionSteps.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2"
                      >
                        <div className="text-xs font-semibold text-slate-400">
                          {sIdx === 0
                            ? 'Step 0: Initial Split (Accepting vs Non-Accepting)'
                            : `Step ${sIdx.toString()}: Refined Partition`}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {step.map((part, pIdx) => {
                            const ids = Array.from(part);
                            const names = ids.map(
                              (id) => nodes.find((n) => n.id === id)?.label ?? id,
                            );
                            return (
                              <div
                                key={pIdx}
                                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-indigo-300"
                              >
                                {`{ ${names.join(', ')} }`}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {minimization.unreachableStates.length > 0 && (
                    <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-lg text-xs text-amber-300">
                      <strong>Removed Unreachable States:</strong>{' '}
                      {minimization.unreachableStates
                        .map(
                          (id) => nodes.find((n) => n.id === id)?.label ?? id,
                        )
                        .join(', ')}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={(): void => {
              setOpen(false);
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition"
          >
            Cancel
          </button>
          {minimization && (
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition flex items-center gap-2 shadow-lg shadow-emerald-900/30"
            >
              <span>✓</span> Apply Minimal DFA to Canvas
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
