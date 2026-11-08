import { useState, useMemo, type ReactElement } from 'react';
import { buildLL1Table, simulateLL1 } from '../../core/grammar/LL1Parser';
import type { GrammarData } from '../../types/grammar';

interface LL1ParserViewProps {
  grammar: GrammarData;
}

export function LL1ParserView({ grammar }: LL1ParserViewProps): ReactElement {
  const [testString, setTestString] = useState('ab');
  const [stepIndex, setStepIndex] = useState(0);

  const ll1Data = useMemo(() => buildLL1Table(grammar), [grammar]);
  const simResult = useMemo(
    () => simulateLL1(ll1Data.table, grammar, testString),
    [ll1Data.table, grammar, testString]
  );

  const variables = Array.from(grammar.variables);
  const terminals = Array.from(grammar.terminals);
  terminals.push('$');

  const currentStep = simResult.steps[stepIndex] ?? simResult.steps[0];

  return (
    <div className="flex flex-col gap-5 p-4 text-gray-100 bg-gray-900 border border-gray-800 rounded-xl shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-indigo-400">LL(1) Predictive Parsing Suite</h3>
          <p className="text-xs text-gray-400">
            Top-down deterministic parser with FIRST/FOLLOW sets and step-by-step stack simulation.
          </p>
        </div>
        <div>
          {ll1Data.hasConflicts ? (
            <span className="px-3 py-1 rounded-md text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-700">
              ⚠ Non-LL(1) Grammar (Conflicts Detected)
            </span>
          ) : (
            <span className="px-3 py-1 rounded-md text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700">
              ✓ Valid LL(1) Grammar
            </span>
          )}
        </div>
      </div>

      {/* FIRST & FOLLOW Sets Table */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          FIRST & FOLLOW Sets
        </h4>
        <div className="overflow-x-auto border border-gray-800 rounded-lg bg-gray-950">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800 font-mono">
              <tr>
                <th className="py-2 px-3 w-28">Variable</th>
                <th className="py-2 px-3">FIRST(V)</th>
                <th className="py-2 px-3">FOLLOW(V)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {variables.map((v) => {
                const fSet = Array.from(ll1Data.firstSets.get(v) ?? []);
                const foSet = Array.from(ll1Data.followSets.get(v) ?? []);
                return (
                  <tr key={v} className="hover:bg-gray-900/50">
                    <td className="py-1.5 px-3 font-bold text-indigo-300">{v}</td>
                    <td className="py-1.5 px-3 text-emerald-400">&#123;{fSet.join(', ')}&#125;</td>
                    <td className="py-1.5 px-3 text-purple-400">&#123;{foSet.join(', ')}&#125;</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* LL(1) Parse Table M[A, a] */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          LL(1) Parse Table M[Variable, Terminal]
        </h4>
        <div className="overflow-x-auto border border-gray-800 rounded-lg bg-gray-950">
          <table className="w-full text-xs text-center">
            <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800 font-mono">
              <tr>
                <th className="py-2 px-3 text-left w-20">Var</th>
                {terminals.map((t) => (
                  <th key={t} className="py-2 px-2 min-w-16">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {variables.map((v) => {
                const row = ll1Data.table.get(v);
                return (
                  <tr key={v} className="hover:bg-gray-900/50">
                    <td className="py-1.5 px-3 font-bold text-indigo-300 text-left">{v}</td>
                    {terminals.map((t) => {
                      const rules = row?.get(t) ?? [];
                      const isConflict = rules.length > 1;
                      return (
                        <td
                          key={t}
                          className={`py-1.5 px-2 border-l border-gray-800/50 ${
                            isConflict
                              ? 'bg-amber-950/40 text-amber-300 font-bold'
                              : rules.length > 0
                              ? 'text-gray-200'
                              : 'text-gray-600'
                          }`}
                        >
                          {rules.length > 0
                            ? rules.map((r) => `${r.lhs}→${r.rhs.join('')}`).join(' | ')
                            : '—'}
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

      {/* Step-by-Step Simulation Stepper */}
      <div className="flex flex-col gap-3 pt-2 border-t border-gray-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Parse Simulation
        </h4>

        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-gray-950 px-3 py-1.5 rounded-lg border border-gray-800">
            <span className="text-xs text-gray-500 font-mono">Input:</span>
            <input
              type="text"
              value={testString}
              onChange={(e) => {
                setTestString(e.target.value);
                setStepIndex(0);
              }}
              placeholder="e.g. ab"
              className="flex-1 bg-transparent text-sm font-mono text-white outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setStepIndex((idx) => Math.max(0, idx - 1)); }}
              disabled={stepIndex <= 0}
              className="px-3 py-1.5 rounded bg-gray-800 text-xs text-gray-300 hover:bg-gray-700 disabled:opacity-40 cursor-pointer"
            >
              Step Back
            </button>
            <button
              onClick={() => { setStepIndex((idx) => Math.min(simResult.steps.length - 1, idx + 1)); }}
              disabled={stepIndex >= simResult.steps.length - 1}
              className="px-3 py-1.5 rounded bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-40 cursor-pointer"
            >
              Step Forward
            </button>
            <button
              onClick={() => { setStepIndex(0); }}
              className="px-3 py-1.5 rounded bg-gray-800 text-xs text-gray-400 hover:bg-gray-700 cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Current State Ribbon */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-gray-950 rounded-lg border border-gray-800 font-mono text-xs">
          <div>
            <span className="text-gray-500">Stack: </span>
            <span className="font-bold text-indigo-400">
              {currentStep.stack.join(' ')} (top: {currentStep.stack[currentStep.stack.length - 1]})
            </span>
          </div>
          <div>
            <span className="text-gray-500">Input: </span>
            <span className="font-bold text-amber-300">{currentStep.remainingInput}</span>
          </div>
          <div>
            <span className="text-gray-500">Action: </span>
            <span className="font-bold text-emerald-400">{currentStep.action}</span>
          </div>
        </div>

        {/* Status result */}
        <div className="text-xs">
          {simResult.accepted ? (
            <span className="text-emerald-400 font-semibold">
              ✓ Input successfully parsed and accepted by LL(1) driver!
            </span>
          ) : (
            <span className="text-red-400 font-semibold">
              ✗ {simResult.error ?? 'Input rejected by parser.'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
