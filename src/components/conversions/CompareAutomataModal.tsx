import React, { useState, useMemo } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';
import { checkEquivalence, type EquivalenceCheckResult } from '../../core/automataEquivalence';
import { DFAMinimizer } from '../../core/DFAMinimizer';
import { parseJFF } from '../../core/io/JFFParser';
import { parseRegex } from '../../core/regex/RegexParser';
import { ThompsonCompiler } from '../../core/regex/ThompsonCompiler';
import { powersetToVisualGraph, initPowersetStep, completePowerset } from '../../core/powersetStepEngine';
import type { DFAData } from '../../types/automata';
import type { AutomataNode, AutomataEdge } from '../../types/ui';

export const CompareAutomataModal: React.FC = (): React.ReactElement | null => {
  const isOpen = useAutomataStore((s) => s.isCompareModalOpen);
  const setOpen = useAutomataStore((s) => s.setCompareModalOpen);
  const startSimulation = useAutomataStore((s) => s.startSimulation);
  const setEditorMode = useAutomataStore((s) => s.setEditorMode);
  const nodes = useAutomataStore((s) => s.nodes);
  const edges = useAutomataStore((s) => s.edges);

  const [inputMode, setInputMode] = useState<'regex' | 'file'>('regex');
  const [m2Regex, setM2Regex] = useState<string>('(0+1)*00');
  const [m2Graph, setM2Graph] = useState<{ nodes: AutomataNode[]; edges: AutomataEdge[]; name: string } | null>(null);

  // Helper to ensure an automaton is converted to a complete/clean DFAData
  const toDFAData = (
    graphNodes: AutomataNode[],
    graphEdges: AutomataEdge[],
  ): DFAData | null => {
    // Attempt direct DFA parse
    const direct = DFAMinimizer.buildDFADataFromCanvas(graphNodes, graphEdges);
    if (direct.dfaData && !direct.error) {
      return direct.dfaData;
    }
    // If it's an NFA, convert to DFA via powerset construction
    try {
      const step0 = initPowersetStep(graphNodes, graphEdges);
      const done = completePowerset(step0, graphNodes, graphEdges);
      const dfaVisual = powersetToVisualGraph(done);
      const parsed = DFAMinimizer.buildDFADataFromCanvas(dfaVisual.nodes, dfaVisual.edges);
      return parsed.dfaData ?? null;
    } catch {
      return null;
    }
  };

  // Build M2 graph based on input mode
  const resolvedM2Graph = useMemo<{ nodes: AutomataNode[]; edges: AutomataEdge[] } | null>(() => {
    if (inputMode === 'regex') {
      if (!m2Regex.trim()) return null;
      try {
        const ast = parseRegex(m2Regex);
        return ThompsonCompiler.compile(ast);
      } catch {
        return null;
      }
    } else {
      return m2Graph ? { nodes: m2Graph.nodes, edges: m2Graph.edges } : null;
    }
  }, [inputMode, m2Regex, m2Graph]);

  // Compute equivalence
  const comparison = useMemo<{
    result: EquivalenceCheckResult | null;
    error: string | null;
  }>(() => {
    if (!isOpen) return { result: null, error: null };

    const dfa1 = toDFAData(nodes, edges);
    if (!dfa1) {
      return {
        result: null,
        error:
          'Canvas automaton (M1) is incomplete or invalid. Ensure it has an initial state.',
      };
    }

    if (!resolvedM2Graph) {
      return {
        result: null,
        error:
          inputMode === 'regex'
            ? 'Please enter a valid regular expression for M2.'
            : 'Please upload a .jff file for M2.',
      };
    }

    const dfa2 = toDFAData(resolvedM2Graph.nodes, resolvedM2Graph.edges);
    if (!dfa2) {
      return {
        result: null,
        error:
          'Secondary automaton (M2) could not be converted to DFA.',
      };
    }

    try {
      const res = checkEquivalence(dfa1, dfa2);
      return { result: res, error: null };
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Equivalence check failed.';
      return { result: null, error: msg };
    }
  }, [isOpen, nodes, edges, resolvedM2Graph, inputMode]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event): void => {
      const xml = event.target?.result;
      if (typeof xml === 'string') {
        try {
          const parsed = parseJFF(xml);
          setM2Graph({
            nodes: parsed.nodes,
            edges: parsed.edges,
            name: file.name,
          });
        } catch {
          alert('Failed to parse JFLAP XML file.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleLoadCounterexample = (ce: string): void => {
    setOpen(false);
    setEditorMode('simulate');
    startSimulation(ce);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="flex flex-col bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-indigo-400">⚖️</span> Automata Equivalence
              Checker
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verify whether M1 and M2 accept the exact same language L(M1) =
              L(M2)
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
          {/* Target M2 Selector */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Compare Canvas (M1) Against (M2):
              </label>
              <div className="flex rounded-lg overflow-hidden border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={(): void => {
                    setInputMode('regex');
                  }}
                  className={`px-3 py-1 font-medium transition ${
                    inputMode === 'regex'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Regular Expression
                </button>
                <button
                  type="button"
                  onClick={(): void => {
                    setInputMode('file');
                  }}
                  className={`px-3 py-1 font-medium transition ${
                    inputMode === 'file'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Upload .jff File
                </button>
              </div>
            </div>

            {inputMode === 'regex' ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={m2Regex}
                  onChange={(e): void => {
                    setM2Regex(e.target.value);
                  }}
                  placeholder="e.g. (0+1)*00"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".jff,.xml"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-indigo-400 hover:file:bg-slate-700 cursor-pointer"
                />
                {m2Graph && (
                  <p className="text-xs text-emerald-400">
                    Loaded: {m2Graph.name} ({m2Graph.nodes.length.toString()}{' '}
                    states)
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Results Display */}
          {comparison.error ? (
            <div className="p-4 bg-amber-950/30 border border-amber-800/60 rounded-xl text-xs text-amber-300 flex items-center gap-2">
              <span>⚠️</span> {comparison.error}
            </div>
          ) : comparison.result ? (
            <div className="space-y-4">
              {comparison.result.areEquivalent ? (
                <div className="bg-emerald-950/40 border border-emerald-600/60 rounded-xl p-6 text-center space-y-2 shadow-lg shadow-emerald-950/20">
                  <div className="text-4xl text-emerald-400">✓</div>
                  <h3 className="text-lg font-bold text-emerald-300">
                    The Automata Are Equivalent!
                  </h3>
                  <p className="text-sm text-slate-300">
                    L(M1) = L(M2). Both machines accept the exact same formal
                    language.
                  </p>
                </div>
              ) : (
                <div className="bg-rose-950/40 border border-rose-600/60 rounded-xl p-6 space-y-4 shadow-lg shadow-rose-950/20">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl text-rose-400">✕</div>
                    <div>
                      <h3 className="text-lg font-bold text-rose-300">
                        Not Equivalent!
                      </h3>
                      <p className="text-xs text-slate-300">
                        A counterexample proves that the languages differ.
                      </p>
                    </div>
                  </div>

                  {/* Counterexample Box */}
                  <div className="bg-slate-950 border border-rose-900/60 rounded-xl p-4 space-y-2">
                    <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                      Shortest Distinguishing Counterexample
                    </div>
                    <div className="font-mono text-xl font-bold text-amber-400 select-all">
                      {comparison.result.counterexample === ''
                        ? 'ε (empty string)'
                        : comparison.result.counterexample}
                    </div>
                    <p className="text-xs text-slate-300">
                      {comparison.result.description}
                    </p>
                  </div>

                  {comparison.result.counterexample !== null && (
                    <button
                      onClick={(): void => {
                        handleLoadCounterexample(
                          comparison.result?.counterexample ?? '',
                        );
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-2 shadow-md shadow-indigo-900/30"
                    >
                      <span>▶</span> Load Counterexample into Canvas Simulation
                    </button>
                  )}
                </div>
              )}
            </div>
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
