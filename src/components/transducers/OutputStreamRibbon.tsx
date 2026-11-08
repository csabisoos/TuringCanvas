import type { ReactElement } from 'react';
import type { TransducerStep } from '../../types/transducers';

interface OutputStreamRibbonProps {
  steps: TransducerStep[];
  currentStepIndex: number;
  machineType: 'mealy' | 'moore';
}

export function OutputStreamRibbon({
  steps,
  currentStepIndex,
  machineType,
}: OutputStreamRibbonProps): ReactElement {
  const currentStep: TransducerStep | undefined =
    steps.length > 0 ? (steps[currentStepIndex] ?? steps[0]) : undefined;

  return (
    <div className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 shadow-md flex flex-col gap-2.5">
      <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
          {machineType === 'mealy' ? 'Mealy' : 'Moore'} Output Stream
        </span>
        <span className="text-[11px] font-mono text-gray-400">
          Step {String(Math.max(0, currentStepIndex))} of {String(Math.max(0, steps.length - 1))}
        </span>
      </div>

      {/* Output stream banner */}
      <div className="flex flex-col gap-1">
        <span className="text-[11px] text-gray-400 font-medium">Generated Output (λ):</span>
        <div className="flex items-center gap-1.5 p-2 bg-gray-950/80 rounded border border-gray-800 overflow-x-auto min-h-[42px]">
          {currentStep !== undefined && currentStep.cumulativeOutput.length > 0 ? (
            currentStep.cumulativeOutput.split('').map((char, idx) => {
              const isLatest = idx === currentStep.cumulativeOutput.length - 1;
              return (
                <span
                  key={idx}
                  className={`inline-flex items-center justify-center w-7 h-7 rounded font-mono text-sm font-bold shadow-sm transition-all duration-150 ${
                    isLatest
                      ? 'bg-purple-600 text-white ring-2 ring-purple-300 scale-105'
                      : 'bg-gray-800 text-purple-200 border border-gray-700'
                  }`}
                >
                  {char}
                </span>
              );
            })
          ) : (
            <span className="text-xs font-mono text-gray-500 italic">
              {machineType === 'mealy' ? '(no output produced yet)' : 'ε'}
            </span>
          )}
        </div>
      </div>

      {/* State & Input breakdown */}
      {currentStep !== undefined && (
        <div className="grid grid-cols-2 gap-2 text-xs bg-gray-950/40 p-2 rounded border border-gray-800/60 font-mono">
          <div>
            <span className="text-gray-500">Current State: </span>
            <span className="font-semibold text-indigo-400">{currentStep.stateId}</span>
          </div>
          <div>
            <span className="text-gray-500">Last Input: </span>
            <span className="font-semibold text-amber-300">
              {currentStep.inputConsumed || 'ε (init)'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
