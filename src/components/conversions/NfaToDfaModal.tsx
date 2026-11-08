import { useState, useEffect, useMemo, type ReactElement } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';
import {
  initPowersetStep,
  expandNextStep,
  completePowerset,
  powersetToVisualGraph,
  type PowersetStepState,
} from '../../core/powersetStepEngine';

export function NfaToDfaModal(): ReactElement | null {
  const isOpen = useAutomataStore((s) => s.isNfaToDfaModalOpen);
  const setOpen = useAutomataStore((s) => s.setNfaToDfaModalOpen);
  const applyConvertedDFA = useAutomataStore((s) => s.applyConvertedDFA);
  const nodes = useAutomataStore((s) => s.nodes);
  const edges = useAutomataStore((s) => s.edges);

  const [overrideState, setOverrideState] = useState<PowersetStepState | null>(null);

  const { initialStepState, initError } = useMemo(() => {
    if (!isOpen) return { initialStepState: null, initError: null };
    try {
      const initial = initPowersetStep(nodes, edges);
      return { initialStepState: initial, initError: null };
    } catch (err) {
      return { initialStepState: null, initError: (err as Error).message };
    }
  }, [isOpen, nodes, edges]);

  const stepState = overrideState ?? initialStepState;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape' && isOpen) {
        setOpen(false);
        setOverrideState(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setOpen]);

  // Transition lookup map: fromKey -> symbol -> toKey
  const transitionMatrix = useMemo(() => {
    const map = new Map<string, Map<string, string>>();
    if (!stepState) return map;
    for (const t of stepState.transitions) {
      let row = map.get(t.fromKey);
      if (!row) {
        row = new Map();
        map.set(t.fromKey, row);
      }
      row.set(t.symbol, t.toKey);
    }
    return map;
  }, [stepState]);

  if (!isOpen) return null;

  function handleNextStep(): void {
    if (!stepState) return;
    const next = expandNextStep(stepState, nodes, edges);
    setOverrideState(next);
  }

  function handleCompleteAll(): void {
    if (!stepState) return;
    const completed = completePowerset(stepState, nodes, edges);
    setOverrideState(completed);
  }

  function handleApply(): void {
    if (!stepState) return;
    const finalState = stepState.isComplete ? stepState : completePowerset(stepState, nodes, edges);
    const graph = powersetToVisualGraph(finalState);
    setOverrideState(null);
    applyConvertedDFA(graph.nodes, graph.edges);
  }

  function handleClose(): void {
    setOverrideState(null);
    setOpen(false);
  }

  function formatSubsetDisplay(key: string): string {
    if (key === '∅') return '∅';
    return `{${key.split('|').join(', ')}}`;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nfa-to-dfa-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/80">
          <div className="flex items-center gap-3">
            <h2 id="nfa-to-dfa-title" className="text-base font-semibold text-white">
              NFA → DFA Powerset Construction Wizard
            </h2>
            {stepState && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  stepState.isComplete
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                }`}
              >
                {stepState.isComplete ? '✓ Construction Complete' : 'In Progress'}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close NFA to DFA modal"
            className="text-gray-400 hover:text-white rounded-md p-1 transition-colors hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        {initError ? (
          <div className="p-6 text-center text-red-400 text-sm">
            ⚠ {initError}
          </div>
        ) : stepState ? (
          <>
            {/* Toolbar */}
            <div className="px-5 py-3 bg-gray-950/60 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={stepState.isComplete}
                  className="px-3 py-1.5 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Step (Expand Next)
                </button>
                <button
                  type="button"
                  onClick={handleCompleteAll}
                  disabled={stepState.isComplete}
                  className="px-3 py-1.5 rounded-md bg-gray-800 text-gray-200 font-medium hover:bg-gray-700 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Complete All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOverrideState(null);
                  }}
                  className="px-3 py-1.5 rounded-md bg-gray-800 text-gray-400 font-medium hover:bg-gray-700 hover:text-white transition-colors cursor-pointer"
                >
                  Reset
                </button>
              </div>

              <div className="text-gray-400 font-mono text-[11px]">
                Alphabet: <span className="text-indigo-300 font-bold">{`{${stepState.alphabet.join(', ')}}`}</span> |
                Subsets: <span className="text-gray-200">{stepState.discoveredSubsets.size}</span> |
                Remaining: <span className="text-amber-400">{stepState.unexpandedSubsets.length}</span>
              </div>
            </div>

            {/* Split content: Transition Table */}
            <div className="flex-1 overflow-y-auto p-5">
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Powerset Transition Table (δ_DFA)
              </h3>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="pb-2 font-medium w-48">DFA Subset State</th>
                    <th className="pb-2 font-medium w-24">Type</th>
                    {stepState.alphabet.map((sym) => (
                      <th key={sym} className="pb-2 font-medium font-mono text-indigo-300">
                        on &apos;{sym}&apos;
                      </th>
                    ))}
                    <th className="pb-2 font-medium w-24 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-mono">
                  {Array.from(stepState.discoveredSubsets.keys()).map((key) => {
                    const isInit = key === stepState.initialKey;
                    const isAcc = stepState.acceptingKeys.has(key);
                    const isExpanded = !stepState.unexpandedSubsets.includes(key);
                    const rowTransitions = transitionMatrix.get(key);

                    return (
                      <tr key={key} className={`hover:bg-gray-800/30 ${!isExpanded ? 'bg-indigo-950/20' : ''}`}>
                        <td className="py-2.5 font-bold text-gray-200">
                          {formatSubsetDisplay(key)}
                        </td>
                        <td className="py-2.5">
                          <div className="flex gap-1 text-[11px] font-sans">
                            {isInit && (
                              <span className="px-1.5 py-0.2 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700">
                                Start
                              </span>
                            )}
                            {isAcc && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-semibold">
                                Accept
                              </span>
                            )}
                            {!isInit && !isAcc && <span className="text-gray-500">—</span>}
                          </div>
                        </td>
                        {stepState.alphabet.map((sym) => {
                          const targetKey = rowTransitions?.get(sym);
                          return (
                            <td key={sym} className="py-2.5">
                              {targetKey ? (
                                <span className="text-indigo-200 bg-gray-800/70 px-1.5 py-0.5 rounded border border-gray-700">
                                  {formatSubsetDisplay(targetKey)}
                                </span>
                              ) : (
                                <span className="text-gray-600 italic">not expanded</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-2.5 text-right font-sans text-xs">
                          {isExpanded ? (
                            <span className="text-emerald-400 font-medium">✓ Done</span>
                          ) : (
                            <span className="text-amber-400 animate-pulse font-medium">Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-800 bg-gray-900/80 flex items-center justify-between">
              <button
                type="button"
                onClick={handleApply}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-500 transition-colors shadow-sm cursor-pointer"
              >
                Apply to Canvas
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-md bg-gray-800 text-gray-300 font-medium text-xs hover:bg-gray-700 hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
