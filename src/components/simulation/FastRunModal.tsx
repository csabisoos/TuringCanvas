import { useEffect, type ReactElement } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';

export function FastRunModal(): ReactElement | null {
  const fastRunResult = useAutomataStore((s) => s.fastRunResult);
  const clearFastRun = useAutomataStore((s) => s.clearFastRun);
  const startSimulation = useAutomataStore((s) => s.startSimulation);
  const setEditorMode = useAutomataStore((s) => s.setEditorMode);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape' && fastRunResult) {
        clearFastRun();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fastRunResult, clearFastRun]);

  if (!fastRunResult) return null;

  function handleLoadIntoStepper(): void {
    if (!fastRunResult) return;
    const input = fastRunResult.input;
    clearFastRun();
    setEditorMode('simulate');
    startSimulation(input);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fast-run-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/80">
          <div className="flex items-center gap-3">
            <h2 id="fast-run-title" className="text-base font-semibold text-white">
              Fast Run Trace
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                fastRunResult.accepted
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-red-950 text-red-300 border border-red-800'
              }`}
            >
              {fastRunResult.accepted ? '✓ Accepted' : '✗ Rejected'}
            </span>
          </div>
          <button
            type="button"
            onClick={clearFastRun}
            aria-label="Close fast run modal"
            className="text-gray-400 hover:text-white rounded-md p-1 transition-colors hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        {/* Input String Summary */}
        <div className="px-5 py-3 bg-gray-950/60 border-b border-gray-800 text-xs text-gray-300 flex items-center justify-between font-mono">
          <div>
            <span className="text-gray-500">Input:</span>{' '}
            <span className="text-indigo-300 font-bold">
              {fastRunResult.input.length === 0 ? 'ε (empty string)' : `"${fastRunResult.input}"`}
            </span>
          </div>
          <div className="text-gray-500">
            Total Steps: <span className="text-gray-300 font-semibold">{fastRunResult.totalSteps}</span>
          </div>
        </div>

        {/* Trace Table */}
        <div className="flex-1 overflow-y-auto p-5">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="pb-2 font-medium w-16">Step</th>
                <th className="pb-2 font-medium w-24">Consumed</th>
                <th className="pb-2 font-medium">Active States</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {fastRunResult.trace.map((step) => (
                <tr key={step.stepIndex} className="hover:bg-gray-800/40">
                  <td className="py-2 text-gray-400">{step.stepIndex}</td>
                  <td className="py-2">
                    {step.symbolConsumed === null ? (
                      <span className="text-gray-500 italic font-sans text-[11px]">initial</span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-gray-800 text-indigo-300 font-semibold">
                        {step.symbolConsumed}
                      </span>
                    )}
                  </td>
                  <td className="py-2">
                    {step.activeStateLabels.length === 0 ? (
                      <span className="text-red-400 italic">∅ (dead configuration)</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {step.activeStateLabels.map((lbl, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-700/60 text-indigo-200 text-xs"
                          >
                            {lbl}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800 bg-gray-900/80 flex items-center justify-between">
          <button
            type="button"
            onClick={handleLoadIntoStepper}
            className="px-4 py-2 rounded-md bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-500 transition-colors shadow-sm cursor-pointer"
          >
            Load into Stepper
          </button>
          <button
            type="button"
            onClick={clearFastRun}
            className="px-4 py-2 rounded-md bg-gray-800 text-gray-300 font-medium text-xs hover:bg-gray-700 hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
