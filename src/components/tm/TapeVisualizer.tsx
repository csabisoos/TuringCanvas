import React from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';

export const TapeVisualizer: React.FC = (): React.ReactElement => {
  const tmSteps = useAutomataStore((s) => s.tmSteps);
  const currentStepIndex = useAutomataStore((s) => s.currentStepIndex);

  const currentStep =
    tmSteps && currentStepIndex >= 0 && currentStepIndex < tmSteps.length
      ? tmSteps[currentStepIndex]
      : null;

  const headPos = currentStep?.headPosition ?? 0;
  const stateId = currentStep?.stateId ?? 'q0';

  // Visible cells: ~13 cells centered on head position
  const visibleCells = currentStep
    ? currentStep.visibleTape
    : Array.from({ length: 13 }, (_, i) => ({
        index: i - 6,
        symbol: i === 6 ? '0' : '□',
      }));

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <span className="text-purple-400">🎞️</span> Turing Tape Ribbon
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-sky-300">State: {stateId}</span>
          <span className="text-purple-300 bg-purple-950/60 border border-purple-800/80 px-2 py-0.5 rounded">
            Head @ {headPos.toString()}
          </span>
        </div>
      </div>

      {/* Tape Strip */}
      <div className="overflow-x-auto py-2">
        <div className="flex items-center justify-center gap-1 min-w-max mx-auto px-2">
          {visibleCells.map((cell) => {
            const isHead = cell.index === headPos;
            return (
              <div key={cell.index} className="flex flex-col items-center">
                {/* Cell Block */}
                <div
                  className={`w-9 h-10 rounded border font-mono font-bold text-sm flex items-center justify-center transition-all duration-150 select-none ${
                    isHead
                      ? 'bg-purple-600 text-white border-purple-400 ring-2 ring-purple-400/60 shadow-lg shadow-purple-950/50 scale-105'
                      : 'bg-slate-950 text-slate-300 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  {cell.symbol === '□' ? (
                    <span className="text-slate-600 font-normal">□</span>
                  ) : (
                    cell.symbol
                  )}
                </div>

                {/* Head Pointer / Index label */}
                <div className="h-4 flex items-center justify-center mt-1">
                  {isHead ? (
                    <span className="text-purple-400 text-xs font-bold animate-bounce">
                      ▲
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-600">
                      {cell.index.toString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
