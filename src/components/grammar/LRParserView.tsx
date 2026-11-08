import { useState, useMemo, type ReactElement } from 'react';
import { buildSLR1Table, simulateSLR1 } from '../../core/grammar/LRParser';
import { ParseTreeVisualizer } from './ParseTreeVisualizer';
import type { GrammarData } from '../../types/grammar';

interface LRParserViewProps {
  grammar: GrammarData;
}

export function LRParserView({ grammar }: LRParserViewProps): ReactElement {
  const [testString, setTestString] = useState('acb');
  const [stepIndex, setStepIndex] = useState(0);

  const slrData = useMemo(() => buildSLR1Table(grammar), [grammar]);
  const simResult = useMemo(
    () => simulateSLR1(slrData, grammar, testString),
    [slrData, grammar, testString]
  );

  const terminals = Array.from(grammar.terminals);
  terminals.push('$');
  const variables = Array.from(grammar.variables);

  const currentStep = simResult.steps[stepIndex] ?? simResult.steps[0];

  return (
    <div className="flex flex-col gap-5 p-4 text-gray-100 bg-gray-900 border border-gray-800 rounded-xl shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-indigo-400">SLR(1) / LR(0) Parsing Suite</h3>
          <p className="text-xs text-gray-400">
            Bottom-up shift-reduce parser with LR(0) item sets DFA, ACTION/GOTO tables, and parse tree extraction.
          </p>
        </div>
        <div>
          {slrData.hasConflicts ? (
            <span className="px-3 py-1 rounded-md text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-700">
              ⚠ Non-SLR(1) Grammar (Conflicts Detected)
            </span>
          ) : (
            <span className="px-3 py-1 rounded-md text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700">
              ✓ Valid SLR(1) Grammar ({String(slrData.states.length)} Item Sets)
            </span>
          )}
        </div>
      </div>

      {/* SLR(1) ACTION & GOTO Table */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          SLR(1) ACTION and GOTO Tables
        </h4>
        <div className="overflow-x-auto border border-gray-800 rounded-lg bg-gray-950 max-h-64">
          <table className="w-full text-xs text-center">
            <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800 font-mono sticky top-0">
              <tr>
                <th className="py-2 px-3 text-left w-16">State</th>
                <th
                  colSpan={terminals.length}
                  className="py-1 px-2 border-l border-r border-gray-800 text-indigo-300"
                >
                  ACTION
                </th>
                <th colSpan={variables.length} className="py-1 px-2 text-purple-300">
                  GOTO
                </th>
              </tr>
              <tr className="border-t border-gray-800/60 text-[11px]">
                <th className="py-1 px-2 text-left">#</th>
                {terminals.map((t) => (
                  <th key={t} className="py-1 px-2 border-l border-gray-800/40">
                    {t}
                  </th>
                ))}
                {variables.map((v) => (
                  <th key={v} className="py-1 px-2 border-l border-gray-800/40">
                    {v}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {slrData.states.map((s) => {
                const actionRow = slrData.actionTable.get(s.id);
                const gotoRow = slrData.gotoTable.get(s.id);

                return (
                  <tr key={s.id} className="hover:bg-gray-900/50">
                    <td className="py-1.5 px-3 font-bold text-gray-400 text-left">{String(s.id)}</td>
                    {terminals.map((t) => {
                      const actions = actionRow?.get(t) ?? [];
                      const isConflict = actions.length > 1;
                      return (
                        <td
                          key={t}
                          className={`py-1.5 px-2 border-l border-gray-800/40 ${
                            isConflict
                              ? 'bg-amber-950/40 text-amber-300 font-bold'
                              : actions.length > 0
                              ? 'text-gray-200'
                              : 'text-gray-600'
                          }`}
                        >
                          {actions.length > 0
                            ? actions
                                .map((a) =>
                                  a.type === 'shift'
                                    ? `s${String(a.targetStateId ?? 0)}`
                                    : a.type === 'reduce'
                                    ? `r${String(a.ruleIndex ?? 0)}`
                                    : 'acc'
                                )
                                .join('/')
                            : '—'}
                        </td>
                      );
                    })}
                    {variables.map((v) => {
                      const gotoState = gotoRow?.get(v);
                      return (
                        <td
                          key={v}
                          className="py-1.5 px-2 border-l border-gray-800/40 text-purple-300"
                        >
                          {gotoState !== undefined ? String(gotoState) : '—'}
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
          Shift-Reduce Simulation
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
              placeholder="e.g. acb"
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
        <div className="grid grid-cols-4 gap-2 p-3 bg-gray-950 rounded-lg border border-gray-800 font-mono text-xs">
          <div>
            <span className="text-gray-500">States: </span>
            <span className="font-bold text-indigo-400">
              [{currentStep.stateStack.join(', ')}]
            </span>
          </div>
          <div>
            <span className="text-gray-500">Symbols: </span>
            <span className="font-bold text-purple-300">
              [{currentStep.symbolStack.join(', ')}]
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
              ✓ Input successfully parsed and accepted by SLR(1) driver!
            </span>
          ) : (
            <span className="text-red-400 font-semibold">
              ✗ {simResult.error ?? 'Input rejected by parser.'}
            </span>
          )}
        </div>
      </div>

      {/* Derivation Tree / Parse Tree (Task 6.6) */}
      {simResult.parseTreeRoot && (
        <div className="pt-2">
          <ParseTreeVisualizer root={simResult.parseTreeRoot} />
        </div>
      )}
    </div>
  );
}
