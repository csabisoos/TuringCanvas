import { useState, useMemo, type ReactElement } from 'react';
import { runCYK, type CYKCell } from '../../core/grammar/CYKParser';
import { convertToCNF } from '../../core/grammar/GrammarTransformations';
import type { GrammarData } from '../../types/grammar';

interface CYKTableViewProps {
  grammar: GrammarData;
}

export function CYKTableView({ grammar }: CYKTableViewProps): ReactElement {
  const [testString, setTestString] = useState('[]');
  const [selectedCell, setSelectedCell] = useState<CYKCell | null>(null);

  // Convert to CNF if not already in CNF
  const cnfGrammar = useMemo(() => convertToCNF(grammar), [grammar]);

  const cykResult = useMemo(() => {
    return runCYK(cnfGrammar, testString);
  }, [cnfGrammar, testString]);

  const n = testString.length;

  return (
    <div className="flex flex-col gap-4 p-4 text-gray-100 bg-gray-900 border border-gray-800 rounded-xl shadow-lg">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-bold text-indigo-400">CYK Dynamic Programming Table</h3>
        <p className="text-xs text-gray-400">
          Upper-triangular parse table $V[l, i]$ for CNF grammars in $O(n^3)$ time.
        </p>
      </div>

      {/* Input row */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-gray-950 px-3 py-1.5 rounded-lg border border-gray-800">
          <span className="text-xs text-gray-500 font-mono">Input:</span>
          <input
            type="text"
            value={testString}
            onChange={(e) => {
              setTestString(e.target.value);
              setSelectedCell(null);
            }}
            placeholder="e.g. () or ab"
            className="flex-1 bg-transparent text-sm font-mono text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {testString.length === 0 ? (
            <span className="px-3 py-1 rounded text-xs bg-gray-800 text-gray-400 font-mono">
              (empty string)
            </span>
          ) : cykResult.accepted ? (
            <span className="px-3 py-1 rounded-md text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700">
              ✓ Accepted by {cnfGrammar.startVariable}
            </span>
          ) : (
            <span className="px-3 py-1 rounded-md text-xs font-semibold bg-red-950 text-red-300 border border-red-700">
              ✗ Rejected
            </span>
          )}
        </div>
      </div>

      {/* Triangular Table View */}
      {n > 0 && (
        <div className="flex flex-col gap-2 overflow-x-auto p-2 bg-gray-950/60 rounded-lg border border-gray-800/80">
          {/* Letters row at the bottom / header */}
          <div className="flex gap-2 mb-1 justify-center">
            {testString.split('').map((char, idx) => (
              <div
                key={idx}
                className="w-16 h-7 flex items-center justify-center font-mono text-xs font-bold bg-gray-800 text-amber-300 rounded border border-gray-700"
              >
                w[{String(idx)}] = &apos;{char}&apos;
              </div>
            ))}
          </div>

          {/* Render rows from l = n down to 1 (top of triangle to base) */}
          <div className="flex flex-col gap-2 items-center">
            {Array.from({ length: n }).map((_, rIdx) => {
              const l = n - rIdx; // substring length from n down to 1
              const row = cykResult.table[l - 1] ?? [];

              return (
                <div key={l} className="flex gap-2">
                  <div className="w-12 text-[10px] text-gray-500 font-mono flex items-center justify-end pr-1">
                    len {String(l)}:
                  </div>
                  {row.map((cell) => {
                    const isTop = l === n && cell.startIdx === 0;
                    const containsStart = cell.variables.has(cnfGrammar.startVariable);
                    const isSelected =
                      selectedCell?.startIdx === cell.startIdx && selectedCell.length === cell.length;
                    const varList = Array.from(cell.variables);

                    return (
                      <button
                        key={cell.startIdx}
                        onClick={() => { setSelectedCell(cell); }}
                        className={`w-16 min-h-[42px] p-1 rounded font-mono text-xs flex flex-wrap items-center justify-center gap-1 border transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-indigo-400 border-indigo-400 bg-indigo-950/50'
                            : isTop && containsStart
                            ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
                            : cell.variables.size > 0
                            ? 'bg-gray-800/80 border-gray-700 text-gray-200 hover:border-gray-500'
                            : 'bg-gray-900/40 border-gray-800/60 text-gray-600 hover:border-gray-700'
                        }`}
                        title={`Substring: "${testString.slice(cell.startIdx, cell.startIdx + cell.length)}"`}
                      >
                        {varList.length > 0 ? (
                          varList.map((v) => (
                            <span
                              key={v}
                              className={`px-1 py-0.5 rounded text-[10px] ${
                                v === cnfGrammar.startVariable
                                  ? 'bg-emerald-900 text-emerald-200 font-bold'
                                  : 'bg-indigo-900 text-indigo-200'
                              }`}
                            >
                              {v}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-600 text-[11px]">∅</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Cell Inspector */}
      {selectedCell && (
        <div className="p-3 bg-gray-950 rounded-lg border border-gray-800 text-xs flex flex-col gap-2">
          <div className="flex justify-between items-center border-b border-gray-800 pb-1.5">
            <span className="font-semibold text-indigo-400">
              Cell Details: Substring &apos;
              {testString.slice(selectedCell.startIdx, selectedCell.startIdx + selectedCell.length)}
              &apos; (len {String(selectedCell.length)}, start {String(selectedCell.startIdx)})
            </span>
            <span className="font-mono text-gray-400">
              Deriving Variables: [{Array.from(selectedCell.variables).join(', ') || 'none'}]
            </span>
          </div>

          {selectedCell.backPointers.length > 0 ? (
            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
              <span className="text-[11px] text-gray-400">Derivation splits:</span>
              {selectedCell.backPointers.map((bp, idx) => (
                <div key={idx} className="font-mono text-[11px] text-gray-300">
                  • <span className="text-emerald-400 font-bold">{bp.variable}</span> →{' '}
                  <span className="text-indigo-300">{bp.leftVar}</span> [split at {String(bp.split)}] +{' '}
                  <span className="text-indigo-300">{bp.rightVar}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-gray-500 italic">
              {selectedCell.length === 1 ? 'Terminal rule match' : 'No derivations for this cell.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
