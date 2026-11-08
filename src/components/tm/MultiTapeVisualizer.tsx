import React from 'react';
import type { MultiTapeTMStep } from '../../types/multiTapeTM';

interface MultiTapeVisualizerProps {
  currentStep: MultiTapeTMStep | null;
}

export const MultiTapeVisualizer: React.FC<MultiTapeVisualizerProps> = ({
  currentStep,
}: MultiTapeVisualizerProps): React.ReactElement => {
  const tapeCount = currentStep?.visibleTapes.length ?? 2;
  const stateId = currentStep?.stateId ?? 'q0';

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <span className="text-purple-400">🎞️🎞️</span> Multi-Tape Turing Visualizer
        </div>
        <div className="text-[11px] font-mono text-sky-300">
          State: {stateId} | Tapes: {tapeCount.toString()}
        </div>
      </div>

      {/* Stacked Tapes */}
      <div className="space-y-3">
        {Array.from({ length: tapeCount }).map((_, tapeIdx) => {
          const visible =
            currentStep?.visibleTapes[tapeIdx] ??
            Array.from({ length: 11 }, (__, i) => ({
              index: i - 5,
              symbol: '□',
            }));
          const headPos = currentStep?.headPositions[tapeIdx] ?? 0;

          return (
            <div
              key={tapeIdx}
              className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 space-y-1.5"
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="font-semibold text-purple-300">
                  Tape {(tapeIdx + 1).toString()}
                </span>
                <span>Head @ {headPos.toString()}</span>
              </div>

              {/* Tape cells strip */}
              <div className="overflow-x-auto py-1">
                <div className="flex items-center justify-center gap-1 min-w-max mx-auto px-1">
                  {visible.map((cell) => {
                    const isHead = cell.index === headPos;
                    return (
                      <div
                        key={cell.index}
                        className="flex flex-col items-center"
                      >
                        <div
                          className={`w-7 h-8 rounded border font-mono font-bold text-xs flex items-center justify-center select-none ${
                            isHead
                              ? 'bg-purple-600 text-white border-purple-400 ring-2 ring-purple-400/50 scale-105'
                              : 'bg-slate-900 text-slate-300 border-slate-700/80'
                          }`}
                        >
                          {cell.symbol === '□' ? (
                            <span className="text-slate-600">□</span>
                          ) : (
                            cell.symbol
                          )}
                        </div>
                        <span className="text-[9px] font-mono text-slate-600 mt-0.5">
                          {isHead ? '▲' : cell.index.toString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
