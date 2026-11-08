import React from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';

export const StackVisualizer: React.FC = (): React.ReactElement => {
  const pdaSteps = useAutomataStore((s) => s.pdaSteps);
  const currentStepIndex = useAutomataStore((s) => s.currentStepIndex);
  const selectedConfigIndex = useAutomataStore((s) => s.selectedPdaConfigIndex);
  const setSelectedConfigIndex = useAutomataStore((s) => s.setSelectedPdaConfigIndex);

  const currentStep =
    pdaSteps && currentStepIndex >= 0 && currentStepIndex < pdaSteps.length
      ? pdaSteps[currentStepIndex]
      : null;

  const configs = currentStep ? currentStep.configurations : [];
  const safeIndex =
    selectedConfigIndex >= 0 && selectedConfigIndex < configs.length
      ? selectedConfigIndex
      : 0;

  const activeConfig = configs.length > 0 ? configs[safeIndex] : undefined;
  const stack = activeConfig ? activeConfig.stack : ['Z'];

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
      {/* Title & Controls */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <span className="text-indigo-400">📚</span> PDA Stack Visualizer
        </div>
        {configs.length > 1 && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">Branch:</span>
            <select
              value={safeIndex}
              onChange={(e): void => {
                setSelectedConfigIndex(Number(e.target.value));
              }}
              className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-200 focus:outline-none"
            >
              {configs.map((c, idx) => (
                <option key={idx} value={idx}>
                  {`#${(idx + 1).toString()} (State: ${c.stateId})`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Active Branch Status */}
      {activeConfig !== undefined && (
        <div className="flex items-center justify-between text-[11px] bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono">
          <span className="text-sky-300">State: {activeConfig.stateId}</span>
          <span className="text-slate-400">
            Remaining: &quot;{activeConfig.remainingInput}&quot;
          </span>
        </div>
      )}

      {/* Vertical Stack Tube */}
      <div className="flex flex-col items-center">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
          Top ▲
        </div>

        {/* The Stack Box: Open at top, bordered left, right, and bottom */}
        <div className="w-32 min-h-36 max-h-56 overflow-y-auto border-x-2 border-b-2 border-slate-600 bg-slate-950/90 rounded-b-lg p-2 flex flex-col items-center gap-1 shadow-inner">
          {stack.length === 0 ? (
            <div className="my-auto text-[11px] text-slate-600 italic">
              ⟨Empty Stack ∅⟩
            </div>
          ) : (
            stack.map((sym, idx) => (
              <div
                key={idx}
                className={`w-full py-1.5 rounded text-center font-mono font-bold text-xs transition-all duration-150 ${
                  idx === 0
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40 ring-1 ring-indigo-400'
                    : 'bg-slate-800 text-slate-200 border border-slate-700/80'
                }`}
              >
                {sym}
              </div>
            ))
          )}
        </div>

        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">
          Bottom ▼
        </div>
      </div>
    </div>
  );
};
