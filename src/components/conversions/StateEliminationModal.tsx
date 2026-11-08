import React, { useMemo, useState } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';
import type { GNFA } from '../../core/GNFA';
import { automatonToGNFA } from '../../core/GNFA';

export const StateEliminationModal: React.FC = (): React.ReactElement | null => {
  const isOpen = useAutomataStore((s) => s.isGnfaModalOpen);
  const setOpen = useAutomataStore((s) => s.setGnfaModalOpen);
  const nodes = useAutomataStore((s) => s.nodes);
  const edges = useAutomataStore((s) => s.edges);

  const [copied, setCopied] = useState(false);
  // Track eliminated states sequence to drive the GNFA stepper
  const [eliminatedHistory, setEliminatedHistory] = useState<string[]>([]);

  // Compute GNFA based on current graph and eliminated history
  const { gnfa, error, remainingStates } = useMemo<{
    gnfa: GNFA | null;
    error: string | null;
    remainingStates: string[];
  }>(() => {
    if (!isOpen) return { gnfa: null, error: null, remainingStates: [] };

    try {
      const g = automatonToGNFA(nodes, edges);
      // Re-apply eliminated states from history
      for (const st of eliminatedHistory) {
        if (g.getRemainingIntermediateStates().includes(st)) {
          g.eliminateState(st);
        }
      }
      return {
        gnfa: g,
        error: null,
        remainingStates: g.getRemainingIntermediateStates(),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create GNFA.';
      return { gnfa: null, error: msg, remainingStates: [] };
    }
  }, [isOpen, nodes, edges, eliminatedHistory]);

  if (!isOpen) return null;

  const handleEliminate = (stateId: string): void => {
    setEliminatedHistory((prev) => [...prev, stateId]);
  };

  const handleEliminateAll = (): void => {
    if (!gnfa) return;
    const remaining = [...remainingStates];
    setEliminatedHistory((prev) => [...prev, ...remaining]);
  };

  const handleReset = (): void => {
    setEliminatedHistory([]);
  };

  const handleCopy = async (regex: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(regex);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Fallback
    }
  };

  const finalRegex = gnfa ? gnfa.getFinalRegex() : '';
  const isComplete = remainingStates.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="flex flex-col bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-purple-400">✨</span> GNFA State Elimination
              → RegEx
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Rip intermediate states one-by-one to synthesize the equivalent
              Regular Expression
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
            <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-6 text-center space-y-3">
              <div className="text-3xl">⚠️</div>
              <h3 className="text-lg font-semibold text-rose-300">
                Cannot Convert Automaton
              </h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto">{error}</p>
            </div>
          ) : gnfa ? (
            <>
              {/* Stepper info */}
              <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                <div>
                  <div className="text-xs text-slate-400">
                    Remaining Intermediate States
                  </div>
                  <div className="text-base font-semibold text-purple-300 mt-0.5">
                    {remainingStates.length > 0 ? (
                      <span>{remainingStates.length.toString()} to eliminate</span>
                    ) : (
                      <span className="text-emerald-400">
                        All states eliminated!
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    disabled={eliminatedHistory.length === 0}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-xs font-medium transition"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleEliminateAll}
                    disabled={isComplete}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition shadow-md shadow-purple-900/30"
                  >
                    Eliminate All
                  </button>
                </div>
              </div>

              {/* State elimination buttons */}
              {!isComplete && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-300">
                    Choose a state to eliminate next:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {remainingStates.map((stId) => {
                      const label =
                        nodes.find((n) => n.id === stId)?.label ?? stId;
                      return (
                        <button
                          key={stId}
                          onClick={(): void => {
                            handleEliminate(stId);
                          }}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-purple-700/50 border border-purple-500/40 hover:border-purple-400 rounded-lg text-xs font-mono text-slate-200 transition flex items-center gap-1.5"
                        >
                          <span className="text-rose-400">✕ Rip</span>
                          <span className="font-bold text-white">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Final regex or current expression */}
              <div className="bg-slate-950 border border-purple-900/40 rounded-xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-purple-400">
                    {isComplete
                      ? 'Equivalent Regular Expression:'
                      : 'Current Expression (q_start → q_accept):'}
                  </div>
                  <button
                    onClick={(): void => {
                      void handleCopy(finalRegex);
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 transition"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <div className="font-mono text-lg font-bold text-emerald-400 break-all select-all py-1">
                  {finalRegex}
                </div>
              </div>

              {/* Active GNFA Transitions Table */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-400">
                  Current GNFA Generalized Transitions (
                  {gnfa.getTransitions().length.toString()})
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-lg divide-y divide-slate-800/80 bg-slate-950/60 text-xs">
                  {gnfa.getTransitions().map((t, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2 flex items-center justify-between font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sky-300 font-semibold">
                          {t.from}
                        </span>
                        <span className="text-slate-500">→</span>
                        <span className="text-emerald-300 font-semibold">
                          {t.to}
                        </span>
                      </div>
                      <div className="text-purple-300 font-bold max-w-xs truncate">
                        {t.expression}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={(): void => {
              setOpen(false);
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
